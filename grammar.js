const javascript = require('./javascript');
const css = require('./css');

module.exports = grammar({
  name: 'jsslang',

  ...javascript,
  externals: $ => [
    $._automatic_semicolon,
    $._template_chars,
    $._ternary_qmark,

    $._descendant_operator, //TODO
  ],
  conflicts: $ => [
    [$._jssStatement, $.statement],
    [$.unary_expression, $.cssLiteral],
    [$.primary_expression, $.cssLiteral],
    [$.labeled_statement, $.cssLiteral],
    [$.assignment_expression, $.pattern, $.cssLiteral],
    [$.primary_expression, $.pattern, $.cssLiteral],
    [$._augmented_assignment_lhs, $.cssLiteral],
    [$.primary_expression, $._jssSelector],
    [$.assignment_expression, $.cssLiteral],

    [$._jssSelector, $.jssPropertyName],

    ...javascript.conflicts($),
  ],
  rules: {
    ...javascript.rules,

    program: $ => seq(
      optional($.hash_bang_line),
      repeat($._jssStatement)
    ),

    _jssStatement: $ => choice(
      $.stylessheetItem,
      $.statement,
    ),

    jss_identifier: $ => { // js identifier without $
      const alpha = /[^\x00-\x1F\s\p{Zs}0-9:$;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      const alphanumeric = /[^\x00-\x1F\s\p{Zs}:$;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      return token(seq(alpha, repeat(alphanumeric)));
    },

    cssLiteral: $ => prec.right(repeat1(
      choice(
        $.jss_identifier,
        '-', //TODO no spacesuhere
      ),
    )),

    stylessheetItem: $ => choice(
      //rulesetStatement,
      $.rule_set,
      //jssVariableStatement,
      $.jssVariableStatement,
      //startsWithDog,
      $.css_import_statement,
    ),

    jssVariableStatement: $ => seq(
      optional('export'),
      choice('var', 'const', 'let'),
      $.identifier,
      '=',
      'block', //TODO noLineTerminatorHere
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

    _jssSelector: $ => choice(
      $.universal_selector,
      alias($._jssIdent, $.tag_name),
      $.class_selector,
      $.nesting_selector,
      $.pseudo_class_selector,
      $.pseudo_element_selector,
      $.id_selector,
      $.attribute_selector,
      $.string,
      $.child_selector,
      $.descendant_selector,
      $.sibling_selector,
      $.adjacent_sibling_selector
    ),

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

    descendant_selector: $ => prec.left(seq($._jssSelector, $._descendant_operator, $._jssSelector)),

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
      $.jssDeclaration,
      $.rule_set,
      //$.import_statement,
      //$.media_statement,
      //$.charset_statement,
      //$.namespace_statement,
      //$.keyframes_statement,
      //$.supports_statement,
      //$.at_rule
    ),

    jssDeclaration: $ => seq(
      choice(
        $.jssPropertyDefinition,
        $.jssSpreadDefinition,
      ),
    ),

    jssPropertyDefinition: $ => seq(
      $.jssPropertyName,
      ':',
      $.jssPropertyValue,
      ';'
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
        $.string,
        seq('(', $.jssPropertyValue , ')'), //TODO expend on what is inside of ()
        $.parenthesized_value, //TODO can contain ${}
        '+', '@', '!', '/', '.', '#', '%', ','
      )
    ),

    jssSpreadDefinition: $ => seq(
      '...',
      $.expression,
      ';'
    ),

    css_identifier: $ => /(--|-?[a-zA-Z_])[a-zA-Z0-9-_]*/,

    _value: $ => prec(-1, choice(
      alias($.css_identifier, $.plain_value),
      $.plain_value,
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
      alias($.css_identifier, $.function_name),
      $.arguments
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
      repeat1($._value),
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

  },
});

function sep (separator, rule) {
  return optional(sep1(separator, rule));
}

function sep1 (separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}
