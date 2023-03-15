(combinator) @operator

(elementName) @tag

"~" @operator
">" @operator
"+" @operator
"-" @operator
"*" @operator
"/" @operator
"=" @operator
"^=" @operator
"|=" @operator
;"~=" @operator
;"$=" @operator
;"*=" @operator
"..." @operator
;(pseudo [":" "::"] @operator)
(and) @operator
(or) @operator
(not) @operator
(only) @operator

(hash) @property
(cssClass) @property
(attribute_name) @property
;(feature_name) @property
(jssPropertyName) @property

(css_function_name) @function

(any_value) @string
(uri) @string

"@media" @keyword
"@import" @keyword
"@charset" @keyword
"@namespace" @keyword
"@supports" @keyword
"@keyframes" @keyword
"@block" @keyword
(at_keyword) @keyword
(to) @keyword
(from) @keyword
;"!important" @keyword

(string) @string
(color_value) @string.special

(integer_value) @number
(float_value) @number
(unit) @type

(jssPropertyDefinition ":" @punctuation.delimiter)
