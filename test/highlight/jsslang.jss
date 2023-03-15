@import "style.css";
// ^ keyword
//       ^ string

const block = @block {
// ^ keyword
//     ^ variable
//          ^ operator
//            ^ keyword
    display: block;
//  ^ property
}

input.className:hover {
// ^ tag
//    ^ property
//             ^ property
    prop-${name}: ${value};
//    ^ property
//       ^ template_substitution
//             ^ punctuation.delimiter
//                ^ template_substitution
}
