const javascript = require('./javascript');
const css = require('./css');

module.exports = grammar({
  name: 'jsslang',

  ...javascript,

  word: $ => $._identifierNotReserved,

  externals: $ => [
    $._automatic_semicolon,
    $._template_chars,
    $._ternary_qmark,
    $._identifierNotReserved,
    //TODO consider adding reservedIdentifier for usage in css selectors
  ],
  conflicts: $ => [
    ...javascript.conflicts($),
    [$._cssLiteralTailIdent],
    [$._cssLiteralTailMinus],
    [$.cssLiteral],
    [$._rest],
    [$.simpleSelector, $.jssPropertyName],
    [$.cssLiteral, $.jssPropertyValue],
    [$.jssPropertyValue],

    [$.primary_expression, $.function, $.generator_function],
    [$.binary_expression, $.jssSpreadDefinition],
    [$.subscript_expression, $.jssSpreadDefinition],
    [$.member_expression, $.jssSpreadDefinition],
    [$.update_expression, $.jssSpreadDefinition],

    [$.primary_expression, $.cssLiteral],
    [$.labeled_statement, $.cssLiteral],
    [$.assignment_expression, $.pattern, $.cssLiteral],
    [$.primary_expression, $.pattern, $.cssLiteral],
    [$._augmented_assignment_lhs, $.cssLiteral],
    [$.primary_expression, $._cssLiteralTailIdent],
    [$.primary_expression, $._cssLiteralTailMinus],
    [$.decorator_call_expression, $.cssLiteral],
    [$.assignment_expression, $._cssLiteralTailMinus],
    [$._augmented_assignment_lhs, $._cssLiteralTailMinus],
    [$.assignment_expression, $.cssLiteral],

    [$.simpleSelector, $.jssPropertyName, $.css_identifier],
    [$._rest, $.css_identifier],
    [$.cssLiteral, $._cssLiteralTailMinus],
    [$.css_identifier, $.at_rule],
    [$.media_query, $.css_identifier],
    [$.cssLiteral, $.namespace_statement],
    [$.cssLiteral, $.keyframes_statement],
    [$.css_identifier, $.supports_in_parens],
    [$.jss_expression, $.css_identifier],
    [$.jssPropertyName, $.css_identifier],
    [$.jssPropertyValue, $.css_identifier],
    [$.any_value, $.css_identifier],

    [$.identifier, $.identifierCss],

  ],
  precedences: $ => [
    ...javascript.precedences($),
  ],
  rules: {
    ...javascript.rules,

    program: $ => seq(
      optional($.hash_bang_line),
      repeat($._jssStatement),
    ),

    _jssStatement: $ => choice(
      $.stylesheetItem,
      $.statement,
    ),

    _identifierJs: $ => { // js identifier without $
      // NOTE: $ symbol in identifier conflicts with string templeates ${}
      const alpha = /[^\x00-\x1F\s\p{Zs}0-9:;`"'@#.,$|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      const alphanumeric = /[^\x00-\x1F\s\p{Zs}:;`"'@#.,$|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      return token(seq(alpha, repeat(alphanumeric)))
    },
    identifier: $ => choice(
      $._identifierNotReserved,
      $._identifierJs,
    ),
    identifierCss: $ => choice(
      $._identifierNotReserved,
      $._identifierJs,
    ),

    cssLiteral: $ => choice(
      seq(
        '-',
        $._cssLiteralTailMinus,
      ),
      seq(
        '--', //NOTE we put two minus here since there is update_expression in javascript
        repeat(token.immediate('-')),
        $._cssLiteralTailMinus,
      ),
      seq(
        $.identifierCss,
        optional($._cssLiteralTailIdent),
      )
    ),

    _cssLiteralTailMinus: $ => seq(
      //$._noSpace,
      $.identifierCss,
      optional($._cssLiteralTailIdent)
    ),

    _cssLiteralTailIdent: $ => seq(
      //$._noSpace,
      '-',
      repeat(token.immediate('-')),
      optional($._cssLiteralTailMinus)
    ),

    stylesheetItem: $ => choice(
      $.jssPropertyDefinition,
      //rulesetStatement,
      $.rule_set,
      //jssVariableStatement,
      $.jssVariableStatement,
      //startsWithDog,
      $.css_import_statement,
      $.media_statement,

      $.charset_statement,
      $.namespace_statement,
      $.keyframes_statement,
      $.supports_statement,
      $.at_rule
    ),

    jssVariableStatement: $ => seq(
      optional('export'),
      choice('var', 'const', 'let'),
      $.identifier,
      '=',
      '@block', //TODO noLineTerminatorHere
      $.block,
      $._semicolon,
    ),

    rule_set: $ => seq(
      $.selectors,
      $.block
    ),

    selectors: $ => sep1(',', $._jssSelector),

    _jssIdent: $ => repeat1(
      choice(
        $.cssLiteral, //TODO no spaces here
        $.template_substitution,
      ),
    ),

    _jssSelector: $ => seq(
      $.simpleSelector,
      repeat(
        seq(
          optional($.combinator),
          $.simpleSelector,
        )
      )
    ),

    simpleSelector: $ => prec.right(choice(
      repeat1($._rest),
      seq(
        alias(
          choice($._jssIdent, $.nesting_selector, $.universal_selector),
          $.elementName,
        ),
        repeat($._rest),
      ),
    )),

    nesting_selector: $ => '&',

    universal_selector: $ => '*',

    combinator: $ => choice(
      '+', '>', '~'
    ),

    _rest: $ => choice(
      alias(
        seq('#', /*$._noSpace,*/ $._jssIdent),
        $.hash
      ),
      alias(
        seq('.', /*$._noSpace,*/ $._jssIdent),
        $.cssClass
      ),
      alias(
        seq(
          '[',
          alias($._jssIdent, $.attribute_name),
          optional(seq(
            choice('=', '~=', '^=', '|=', '*=', '$='),
            $.any_value
          )),
          ']'
        ),
        $.attrib
      ),
      alias(
        seq(
          choice(':', '::'),
          seq(
            alias($._jssIdent, $.pseudo_name),
            optional(seq(
              token.immediate(
                '('
              ),
              optional($.any_value),
              ')'
            ))
          )
        ),
        $.pseudo,
      )
    ),

    // https://w3c.github.io/csswg-drafts/css-syntax-3/#typedef-any-value
    any_value: $ => repeat1(
      choice(
        $.cssLiteral,
        /[^()]/,
        seq('(', optional($.any_value), ')'),
      )
    ),

    block: $ => seq('{',
      repeat($._jssBlockStatmentItem),
      '}'
    ),

    _jssBlockStatmentItem: $ => choice(
      $.rule_set,
      $.jssDeclaration,
      $.media_statement,
      $.jssVariableStatement,
      $.supports_statement,
      $.at_rule,
      $.lexical_declaration,
      $.variable_declaration,
      $.function_declaration,
    ),

    jssDeclaration: $ => seq(
      choice(
        $.jssPropertyDefinition,
        $.jssSpreadDefinition,
      ),
      optional(';')
    ),

    jssPropertyDefinition: $ => seq(
      $.jssPropertyName,
      ':',
      $.jssPropertyValue,
    ),

    jssPropertyName: $ => choice(
      alias($._jssIdent, $.property_identifier),
      $.string,
      $.number,
      $.computed_property_name,
    ),

    jssPropertyValue: $ => repeat1(
      choice(
        $.template_substitution,
        $.cssLiteral,
        $.number,
        $.string,
        $.uri,
        seq('(', $.jssPropertyValue , ')'), //TODO expend on what is inside of ()
        '+', '-', '*', '!', '/', '.', '#', '%', ',', ':', '?', '&'
      )
    ),

    jssSpreadDefinition: $ => seq(
      '...',
      $.expression,
    ),

    // https://drafts.csswg.org/mediaqueries/#mq-syntax
    media_statement: $ => seq(
      '@media',
      $.media_query_list,
      $.block
    ),

    css_function: $ => seq(
      alias($.cssLiteral, $.css_function_name),
      token.immediate('('),
      $.expr,
      ')'
    ),

    term: $ => choice(
      $.integer_value,
      $.float_value,
      $.string,
      $.cssLiteral,
      $.uri,
      $.color_value,
      $.css_function,
    ),

    expr: $ => seq(
      $.term,
      repeat(
        seq(
          choice('/', ','),
          $.term,
        )
      )
    ),

    jss_expression: $ => seq(
      '(',
      alias($.cssLiteral, $.media_feature),
      optional(
        seq(
          ':',
          $.expr,
        )
      ),
      ')'
    ),

    and: $ => 'and',
    or: $ => 'or',
    not: $ => 'not',
    only: $ => 'only',

    media_query: $ => choice(
      seq(
        optional(choice($.not, $.only)),
        alias($.cssLiteral, $.media_type),
        repeat(
          seq(
            choice($.and, $.or),
            $.jss_expression
          )
        )
      ),
      seq(
        $.jss_expression,
        repeat(
          seq(
            choice($.and, $.or),
            $.jss_expression
          )
        )
      )
    ),

    media_query_list: $ => sep1(",", $.media_query),

    uri: $ => seq(
      'url',
      token.immediate('('),
      choice($.string, /[^)]*/),
      ')'
    ),

    css_identifier: $ => $.cssLiteral,

    color_value: $ => seq('#', token.immediate(/[0-9a-fA-F]{3,8}/)),
    integer_value: $ => seq(
      token(seq(
        optional(choice('+', '-')),
        /\d+/
      )),
      optional($.unit)
    ),

    float_value: $ => seq(
      token(seq(
        optional(choice('+', '-')),
        /\d*/,
        choice(
          seq('.', /\d+/),
          seq(/[eE]/, optional('-'), /\d+/),
          seq('.', /\d+/, /[eE]/, optional('-'), /\d+/)
        )
      )),
      optional($.unit)
    ),

    unit: $ => token.immediate(/[a-zA-Z%]+/),

    css_import_statement: $ => seq(
      '@import',
      choice(
        $.string,
        $.uri,
      ),
      optional(
        alias($.media_query_list, $.query_list),
      ),
      ';'
    ),

    charset_statement: $ => seq(
      '@charset',
      $.string,
      ';'
    ),

    namespace_statement: $ => seq(
      '@namespace',
      optional(alias($.css_identifier, $.namespace_name)),
      choice($.string, $.uri),
      ';'
    ),

    keyframes_statement: $ => seq(
      choice(
        '@keyframes',
        alias(/@[-a-z]+keyframes/, $.at_keyword)
      ),
      alias($.css_identifier, $.keyframes_name),
      $.keyframe_block_list,
    ),

    keyframe_block_list: $ => seq(
      '{',
      repeat($.keyframe_block),
      '}'
    ),

    keyframe_block: $ => seq(
      choice($.from, $.to, $.integer_value),
      $.block
    ),

    from: $ => 'from',
    to: $ => 'to',

    supports_statement: $ => seq(
      '@supports',
      $.supports_condition,
      $.block
    ),

    // https://w3c.github.io/csswg-drafts/css-conditional-3/#typedef-supports-decl
    supports_condition: $ => seq(
      optional($.not),
      $.supports_in_parens,
      repeat(
        seq(
          choice($.and, $.or),
          $.supports_in_parens,
        )
      )
    ),

    supports_in_parens: $ => choice(
      seq('(', $.supports_condition, ')'),
      seq('(', $.jssPropertyDefinition, ')'),
      alias(seq($.cssLiteral, '(', optional($.any_value), ')'), $.general_enclosed),
    ),

    general_enclosed: $ => seq(
      optional($.cssLiteral),
      '(',
      optional($.any_value),
      ')'
    ),

    at_keyword: $ => /[a-zA-Z-_]+/,

    at_rule: $ => seq(
      '@',
      //$.at_keyword,
      $.cssLiteral,
      optional(
        alias($.media_query_list, $.query_list),
      ),
      choice(';', $.block)
    ),

    // Media queries

    feature_query: $ => seq(
      '(',
      alias($.css_identifier, $.feature_name),
      ':',
      repeat1($.jssPropertyValue),
      ')'
    ),

    // jsx fix
    _jsx_identifier: $ => choice(
      alias($.jsx_identifier, $.identifier),
      alias($._identifierJs, $.identifier),
    ),

    nested_identifier: $ => prec('member', seq(
      choice(alias($._identifierJs, $.identifier), $.nested_identifier),
      '.',
      alias($._identifierJs, $.identifier),
    )),
  },
});

function sep (separator, rule) {
  return optional(sep1(separator, rule));
}

function sep1 (separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}
