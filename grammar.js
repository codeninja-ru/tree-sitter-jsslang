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
    [$.identifier, $.cssLiteral],
    [$.simpleSelector],
    [$.unary_expression, $.cssLiteral],
    [$._cssLiteralTailIdent],
    [$._cssLiteralTailMinus],
    [$.cssLiteral],
    [$._rest],
    [$.cssLiteral, $.css_binary_expression],
    [$.simpleSelector, $.jssPropertyName],
    [$.simpleSelector, $.css_identifier],
    [$.pseudo_class_arguments, $.css_binary_expression],
    [$.css_arguments, $.css_binary_expression],
    [$.css_binary_expression, $.feature_query],
    [$.jssPropertyValue, $.css_identifier],
    [$.identifier, $._cssLiteralTailMinus],
    [$.cssLiteral, $._cssLiteralTailMinus],
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

    //cssLiteral: $ => repeat1(
    //  choice(
    //    $._identifierNotReserved,
    //    '-', //TODO withoud spaces
    //  ),
    //),
    //

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
        $.identifier,
        optional($._cssLiteralTailIdent),
      )
    ),

    _cssLiteralTailMinus: $ => seq(
      //$._noSpace,
      $.identifier,
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

    //_jssSelector: $ => choice(
    //  $.universal_selector,
    //  alias($._jssIdent, $.tag_name),
    //  $.class_selector,
    //  $.nesting_selector,
    //  $.pseudo_class_selector,
    //  $.pseudo_element_selector,
    //  $.id_selector,
    //  $.attribute_selector,
    //  $.string,
    //  $.child_selector,
    //  $.descendant_selector,
    //  $.sibling_selector,
    //  $.adjacent_sibling_selector
    //),

    // jss way declaration

    //_jssSelector: $ => sep1(
    //  optional(
    //    $.combinator,
    //  ),
    //  $.simpleSelector,
    //),

    _jssSelector: $ => prec.right(seq(
      $.simpleSelector,
      optional($.combinator),
      optional($._jssSelector),
    )),

    //_jssSelector: $ => seq(
    //  choice(
    //    $._jssSelector,
    //    $.simpleSelector,
    //  ),
    //  optional($.combinator),
    //  $.simpleSelector,
    //),

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
            $._value
          )),
          ']'
        ),
        $.attrib
      ),
      alias(
        seq(
          choice(':', '::'),
          seq(
            $._jssIdent,
            optional(seq(
              token.immediate(
                '('
              ),
              optional($.any_value),
              ')'
            ))
            //optional(alias($.pseudo_class_arguments, $.arguments))
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

    // END jss way ends

    nesting_selector: $ => '&',

    universal_selector: $ => '*',

    class_selector: $ => prec(1, seq(
      optional($._jssSelector),
      '.',
      alias($._jssIdent, $.class_name),
    )),

    pseudo_class_selector: $ => seq(
      optional($._jssSelector),
      ':',
      alias($._jssIdent, $.class_name),
      optional(alias($.pseudo_class_arguments, $.arguments))
    ),

    pseudo_element_selector: $ => seq(
      optional($._jssSelector),
      '::',
      alias($._jssIdent, $.tag_name)
    ),

    id_selector: $ => seq(
      optional($._jssSelector),
      '#',
      alias($._jssIdent, $.id_name)
    ),

    attribute_selector: $ => seq(
      optional($._jssSelector),
      '[',
      alias($._jssIdent, $.attribute_name),
      optional(seq(
        choice('=', '~=', '^=', '|=', '*=', '$='),
        $._value
      )),
      ']'
    ),

    child_selector: $ => prec.left(seq($._jssSelector, '>', $._jssSelector)),

    //descendant_selector: $ => prec.left(seq($._jssSelector, $._descendant_operator, $._jssSelector)),
    //descendant_selector: $ => repeat1($._jssSelector),

    sibling_selector: $ => prec.left(seq($._jssSelector, '~', $._jssSelector)),

    adjacent_sibling_selector: $ => prec.left(seq($._jssSelector, '+', $._jssSelector)),

    pseudo_class_arguments: $ => seq(
      token.immediate('('),
      sep(',', choice($._jssSelector, repeat1($._value))),
      ')'
    ),

    block: $ => seq('{',
      repeat($._jssBlockStatmentItem),
      '}'
    ),

    _jssBlockStatmentItem: $ => choice(
      $.rule_set,
      $.jssDeclaration,
      //$.import_statement,
      $.media_statement,
      $.jssVariableStatement,
      //$.charset_statement,
      //$.namespace_statement,
      //$.keyframes_statement,
      $.supports_statement,
      $.at_rule,

      //toRawNode(parseJsVarStatement),
      $.lexical_declaration,
      $.variable_declaration,
      //toRawNode(functionExpression),
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
      $._jssIdent, //NOTE can't containe reserved words
      $.string,
      $.number,
      $.computed_property_name,
    ),

    jssPropertyValue: $ => repeat1(
      choice(
        $.template_substitution,
        $.cssLiteral,
        'var', 'and', 'or', 'not', // allowed literals, this word is reserved by js and is not allowed in cssLiteral
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
      //sep1(',', $._query),
      $.media_query_list,
      $.block
    ),

    css_function: $ => seq(
      $.cssLiteral,
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

    media_query: $ => choice(
      seq(
        optional(choice('not', 'only')),
        alias($.cssLiteral, $.media_type),
        repeat(
          seq(
            'and',
            $.jss_expression
          )
        )
      ),
      seq(
        $.jss_expression,
        repeat(
          seq(
            'and',
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

    //css_identifier: $ => /(--|-?[a-zA-Z_])[a-zA-Z0-9-_]*/,
    css_identifier: $ => $.cssLiteral,

    _value: $ => prec(-1, choice(
      alias($.css_identifier, $.plain_value),
      $.uri,
      $.color_value,
      $.integer_value,
      $.float_value,
      $.string,
      $.css_binary_expression,
      $.parenthesized_value,
      $.css_call_expression
    )),

    plain_value: $ => token(seq(
      repeat(choice(
        /[-_]/,
        /\/[^\*\s,;!{}()\[\]]/ // Slash not followed by a '*' (which would be a comment)
      )),
      /[a-zA-Z]/,
      repeat(choice(
        /[^/\s,;!{}()\[\]]/,   // Not a slash, not a delimiter character
        /\/[^\*\s,;!{}()\[\]]/ // Slash not followed by a '*' (which would be a comment)
      ))
    )),

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

    parenthesized_value: $ => seq(
      '(',
      $._value,
      ')'
    ),
    css_call_expression: $ => seq(
      alias($.css_identifier, $.css_function_name),
      $.css_arguments
    ),

    css_arguments: $ => seq(
      token.immediate('('),
      sep(choice(',', ';'), repeat1($._value)),
      ')'
    ),

    css_binary_expression: $ => prec.left(seq(
      $._value,
      choice('+', '-', '*', '/'),
      $._value
    )),

    css_import_statement: $ => seq(
      '@import',
      $._value,
      sep(',', $._query),
      ';'
    ),

    charset_statement: $ => seq(
      '@charset',
      $._value,
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
      $._query,
      $.block
    ),

    at_keyword: $ => /[a-zA-Z-_]+/,

    at_rule: $ => seq(
      '@',
      //$.at_keyword,
      $.cssLiteral,
      sep(',', $._query),
      choice(';', $.block)
    ),

    // Media queries

    _query: $ => choice(
      alias($.css_identifier, $.keyword_query),
      $.feature_query,
      $.binary_query,
      $.unary_query,
      $.selector_query,
      $.parenthesized_query
    ),

    feature_query: $ => seq(
      '(',
      alias($.css_identifier, $.feature_name),
      ':',
      repeat1($.jssPropertyValue),
      ')'
    ),

    parenthesized_query: $ => seq(
      '(',
      $._query,
      ')'
    ),

    binary_query: $ => prec.left(seq(
      $._query,
      choice('and', 'or'),
      $._query
    )),

    unary_query: $ => prec(1, seq(
      choice('not', 'only'),
      $._query
    )),

    selector_query: $ => seq(
      'selector',
      '(',
      $._jssSelector,
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
