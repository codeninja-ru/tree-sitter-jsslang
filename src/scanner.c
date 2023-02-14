#include <tree_sitter/parser.h>
#include <wctype.h>
#include <wchar.h>

enum TokenType {
  AUTOMATIC_SEMICOLON,
  TEMPLATE_CHARS,
  TERNARY_QMARK,
  IDENTIFIER,
  NO_SPACE,
};

const int CHECK_FOR_IDENTIFIER = 3;

#define TREE_SITTER_DEBUG 0

void *tree_sitter_jsslang_external_scanner_create() { return NULL; }
void tree_sitter_jsslang_external_scanner_destroy(void *p) {}
void tree_sitter_jsslang_external_scanner_reset(void *p) {}
unsigned tree_sitter_jsslang_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_jsslang_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static bool is_alpha(int32_t lookahead) {
  return (lookahead >= 'a' && lookahead <= 'z') ||
     (lookahead >= 'A' && lookahead <= 'Z');
}

static bool is_symbol(int32_t lookahead) {
  switch (lookahead) {
  case '_':
  case '$':
    return true;
  default:
    return false;
  };
}

static bool is_css_or_js_symbol(int32_t lookahead) {
  switch (lookahead) {
  case '_':
  case '-':
  case '$':
    return true;
  default:
    return false;
  };
}

static bool is_css_symbol(int32_t lookahead) {
  switch (lookahead) {
  case '_':
  case '-':
    return true;
  default:
    return false;
  };
}

#define MAX_KEYWORD_SIZE 125
const int32_t KEYWORDS[][MAX_KEYWORD_SIZE] = {
  L"if",
  L"else",
  L"for",
  L"this",
  L"var",
  L"let",
  L"import",
  L"from",
  L"const",
  L"return",
  L"new",
  L"for",
  L"while",
  L"do",
  L"true",
  L"false",
  L"null",
  L"get",
  L"set",
  L"try",
  L"catch",
  L"finally",
  L"throw",
  L"undefined",
  L"await",
  L"async",
  L"function",
  L"class",
  L"static",
  L"extends",
  L"super",
  L"of",
  L"in",
  L"instanceof",
  L"export",
  L"break",
  L"continue",
  L"switch",
  L"case",
  L"default",
  L"arguments",
  L"yield",
  L"delete",
  L"typeof",
  L"with",
  L"debugger",
  L"void",
};

static bool is_keyword(int32_t *token) {
  for (size_t i = 0; i < sizeof(KEYWORDS) / sizeof(KEYWORDS[0]); i++) {
    if (wcscasecmp(token, KEYWORDS[i]) == 0) {
      //#ifdef TREE_SITTER_DEBUG
      //wprintf(L"compare %S with %S\n", token, KEYWORDS[i]);
      //#endif

      //#ifdef TREE_SITTER_DEBUG
      //wprintf(L"OK\n");
      //#endif
      return true;
    }
  }
  //#ifdef TREE_SITTER_DEBUG
  //  wprintf(L"%S is not a keyword\n", token);
  //#endif

  return false;
}

static void add_char(int32_t *token, int token_length, int32_t ch) {
    if (token_length < MAX_KEYWORD_SIZE) {
      //#ifdef TREE_SITTER_DEBUG
      //wprintf(L"adding char %lc to token %S\n", ch, token);
      //#endif
      token[token_length] = ch;
    }
}

static bool scan_identifier_started_with_i(TSLexer *lexer) {
  lexer->result_symbol = IDENTIFIER;
  int token_length = 0;
  int32_t token[MAX_KEYWORD_SIZE] = {};
  wprintf(L"scan_identifier_started_with_i: enter lookahead = %lc (%d)\n", lexer->lookahead, lexer->lookahead);
  add_char(token, token_length++, lexer->lookahead); //the first char is "i"

  for (;;) {
    //wprintf(L"scan_identtifier: the next symbol, lookahead = %lc\n", lexer->lookahead);
    if (is_alpha(lexer->lookahead) ||
        iswdigit(lexer->lookahead) ||
        is_symbol(lexer->lookahead)) {

      //wprintf(L"scan_identtifier: OK, lookahead = %lc\n", lexer->lookahead);

      if (lexer->lookahead == '$') {
        //wprintf(L"scan_identtifier: $ is found, lookahead = %lc\n", lexer->lookahead);
        advance(lexer);
        if (lexer->lookahead == '{') {
          //wprintf(L"scan_identtifier: ${ is found, lookahead = %lc, token = %S\n", lexer->lookahead, token);
          break;
        }
        add_char(token, token_length++, lexer->lookahead);
      } else {
        //wprintf(L"scan_identtifier: end, lookahead = %lc, token = %S\n", lexer->lookahead, token);
        add_char(token, token_length++, lexer->lookahead);
        advance(lexer);
        lexer->mark_end(lexer);
      }

    } else {
      break;
    }
  }

  if (!is_keyword(token)) {
    wprintf(L"scan_identtifier: found token %S  <---------------------------\n", token);
  }
  return !is_keyword(token);
}

static bool scan_identifier(TSLexer *lexer) {
  // exluding ${} from identifiers. see https://github.com/tree-sitter/tree-sitter/discussions/1252
  lexer->result_symbol = IDENTIFIER;

  int token_length = 0;
  int32_t token[MAX_KEYWORD_SIZE] = {};

  wprintf(L"scan_identifier: enter lookahead = %lc (%d)\n", lexer->lookahead, lexer->lookahead);

  //if (lexer->is_at_included_range_start(lexer)) {
  //  while(iswspace(lexer->lookahead)) {
  //    skip(lexer);
  //  }
  //}
  while(iswspace(lexer->lookahead)) {
    skip(lexer);
  }

  if (is_alpha(lexer->lookahead) ||
      is_symbol(lexer->lookahead)) {
    lexer->mark_end(lexer);

    wprintf(L"scan_identifier: the first symbol lookahead = %lc\n", lexer->lookahead);

    if (lexer->lookahead == '$') {
      //wprintf(L"scan_identtifier: the first symbol, $ found lookahead = %lc\n", lexer->lookahead);
      add_char(token, token_length++, lexer->lookahead);
      advance(lexer);
      if (lexer->lookahead == '{') {
        //wprintf(L"scan_identtifier: the first symbol, ${ end lookahead = $lc\n", lexer->lookahead);
        return false;
      }
    } else {
      //wprintf(L"scan_identtifier: the first symbol is not $, lookahead = %lc\n", lexer->lookahead);
      add_char(token, token_length++, lexer->lookahead);
      advance(lexer);
      lexer->mark_end(lexer);
    }

    for (;;) {
      //wprintf(L"scan_identtifier: the next symbol, lookahead = %lc\n", lexer->lookahead);
      if (is_alpha(lexer->lookahead) ||
          iswdigit(lexer->lookahead) ||
          is_symbol(lexer->lookahead)) {

        //wprintf(L"scan_identtifier: OK, lookahead = %lc\n", lexer->lookahead);

        if (lexer->lookahead == '$') {
          //wprintf(L"scan_identtifier: $ is found, lookahead = %lc\n", lexer->lookahead);
          advance(lexer);
          if (lexer->lookahead == '{') {
            //wprintf(L"scan_identtifier: ${ is found, lookahead = %lc, token = %S\n", lexer->lookahead, token);
            //return !is_keyword(token);
            break;
          }
          add_char(token, token_length++, lexer->lookahead);
        } else {
          //wprintf(L"scan_identtifier: end, lookahead = %lc, token = %S\n", lexer->lookahead, token);
          add_char(token, token_length++, lexer->lookahead);
          advance(lexer);
          lexer->mark_end(lexer);
        }

      } else {
        break;
      }
    }
    if (!is_keyword(token)) {
      wprintf(L"scan_identifier: found token %S  <---------------------------\n", token);
    }
    return !is_keyword(token);
  }

  //wprintf(L"scan_identifier: return false, lookahead = %lc, token = %S\n", lexer->lookahead, token);
  return false;
}

static bool scan_no_space(TSLexer *lexer) {
  lexer->result_symbol = NO_SPACE;
  return !iswspace(lexer->lookahead);
}

static bool scan_template_chars(TSLexer *lexer) {
  lexer->result_symbol = TEMPLATE_CHARS;
  for (bool has_content = false;; has_content = true) {
    lexer->mark_end(lexer);
    switch (lexer->lookahead) {
      case '`':
        return has_content;
      case '\0':
        return false;
      case '$':
        advance(lexer);
        if (lexer->lookahead == '{') return has_content;
        break;
      case '\\':
        return has_content;
      default:
        advance(lexer);
    }
  }
}

static bool scan_whitespace_and_comments(TSLexer *lexer) {
  for (;;) {
    while (iswspace(lexer->lookahead)) {
      skip(lexer);
    }

    if (lexer->lookahead == '/') {
      skip(lexer);

      if (lexer->lookahead == '/') {
        skip(lexer);
        while (lexer->lookahead != 0 && lexer->lookahead != '\n') {
          skip(lexer);
        }
      } else if (lexer->lookahead == '*') {
        skip(lexer);
        while (lexer->lookahead != 0) {
          if (lexer->lookahead == '*') {
            skip(lexer);
            if (lexer->lookahead == '/') {
              skip(lexer);
              break;
            }
          } else {
            skip(lexer);
          }
        }
      } else {
        return false;
      }
    } else if (lexer->lookahead == '<') {
      skip(lexer);

      if (lexer->lookahead == '-') {
        skip(lexer);

        if (lexer->lookahead == '-') {
          skip(lexer);
          while (lexer->lookahead != 0) {
            if (lexer->lookahead == '-') {
              skip(lexer);
              if (lexer->lookahead == '-') {
                skip(lexer);
                if (lexer->lookahead == '>') {
                  skip(lexer);
                  break;
                }
              } else {
                skip(lexer);
              }
            } else {
              skip(lexer);
            }
        }

        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}
static bool scan_automatic_semicolon_started_with_i(TSLexer *lexer) {
  // Don't insert a semicolon before `in` or `instanceof`, but do insert one
  // before an identifier.
  skip(lexer);

  if (lexer->lookahead != 'n') return true;
  skip(lexer);

  if (!iswalpha(lexer->lookahead)) return false;

  for (unsigned i = 0; i < 8; i++) {
    if (lexer->lookahead != "stanceof"[i]) return true;
    skip(lexer);
  }

  if (!iswalpha(lexer->lookahead)) return false;

  return true;
}

const int DO_NOT_INSERT_SEMICOLON = 0;
const int INSERT_SEMICOLON = 1;
const int DO_NOT_INSERT_SEMICOLON_SCAN_NEXT = 2;

static int scan_automatic_semicolon(TSLexer *lexer) {
  lexer->result_symbol = AUTOMATIC_SEMICOLON;
  lexer->mark_end(lexer);

  for (;;) {
    if (lexer->lookahead == 0) return INSERT_SEMICOLON;
    if (lexer->lookahead == '}') return INSERT_SEMICOLON;
    if (lexer->is_at_included_range_start(lexer)) return INSERT_SEMICOLON;
    if (lexer->lookahead == '\n') break;
    if (!iswspace(lexer->lookahead)) return DO_NOT_INSERT_SEMICOLON_SCAN_NEXT;
    skip(lexer);
  }

  skip(lexer);

  if (!scan_whitespace_and_comments(lexer)) return DO_NOT_INSERT_SEMICOLON_SCAN_NEXT;

  switch (lexer->lookahead) {
    case ',':
    case '.':
    case ':':
    case ';':
    case '*':
    case '%':
    case '>':
    case '<':
    case '=':
    case '[':
    case '(':
    case '?':
    case '^':
    case '|':
    case '&':
    case '/':
      //TODO do we need "case '$'" here?
      return DO_NOT_INSERT_SEMICOLON;

    // Insert a semicolon before `--` and `++`, but not before binary `+` or `-`.
    case '+':
      skip(lexer);
      if(lexer->lookahead == '+') return INSERT_SEMICOLON; else return DO_NOT_INSERT_SEMICOLON;
    case '-':
      skip(lexer);
      if(lexer->lookahead == '-') return INSERT_SEMICOLON; else return DO_NOT_INSERT_SEMICOLON;

    // Don't insert a semicolon before `!=`, but do insert one before a unary `!`.
    case '!':
      skip(lexer);
      if(lexer->lookahead != '=') return INSERT_SEMICOLON; else return DO_NOT_INSERT_SEMICOLON;

    // Don't insert a semicolon before `in` or `instanceof`, but do insert one
    // before an identifier.
    case 'i':
      // it will be handled in scan_automatic_semicolon_started_with_i
      skip(lexer);

      if (lexer->lookahead != 'n') return INSERT_SEMICOLON;
      skip(lexer);

      if (!iswalpha(lexer->lookahead)) return DO_NOT_INSERT_SEMICOLON;

      for (unsigned i = 0; i < 8; i++) {
        if (lexer->lookahead != "stanceof"[i]) return INSERT_SEMICOLON;
        skip(lexer);
      }


      if (!iswalpha(lexer->lookahead)) return DO_NOT_INSERT_SEMICOLON;
      break;
  }

  return INSERT_SEMICOLON;
}

static bool scan_ternary_qmark(TSLexer *lexer) {
  for(;;) {
    if (!iswspace(lexer->lookahead)) break;
    skip(lexer);
  }

  if (lexer->lookahead == '?') {
    advance(lexer);

    if (lexer->lookahead == '?') return false;

    lexer->mark_end(lexer);
    lexer->result_symbol = TERNARY_QMARK;

    if (lexer->lookahead == '.') {
      advance(lexer);
      if (iswdigit(lexer->lookahead)) return true;
      return false;
    }
    return true;
  }
  return false;
}

bool tree_sitter_jsslang_external_scanner_scan(void *payload, TSLexer *lexer,
                                                  const bool *valid_symbols) {
  wprintf(L"external_scanner_scan: \n\tlookahead = %lc\n\tAUTOMATIC_SEMICOLON = %d\n\tTEMPLATE_CHARS = %d\n\tTERNARY_QMARK = %d\n\tIDENTIFIER = %d\n\tNO_SPACE = %d\n\tis_at_included_range_start = %d\n",
          lexer->lookahead,
          valid_symbols[AUTOMATIC_SEMICOLON],
          valid_symbols[TEMPLATE_CHARS],
          valid_symbols[TERNARY_QMARK],
          valid_symbols[IDENTIFIER],
          valid_symbols[NO_SPACE],
          lexer->is_at_included_range_start(lexer));
  if (valid_symbols[TEMPLATE_CHARS]) {
    if (valid_symbols[AUTOMATIC_SEMICOLON]) return false;
    return scan_template_chars(lexer);
  } else if (valid_symbols[AUTOMATIC_SEMICOLON]) {
    int ret = scan_automatic_semicolon(lexer);
    wprintf(L"scan_automatic_semicolon => %d, lookahead = %lc\n", ret, lexer->lookahead);

    if ((ret == DO_NOT_INSERT_SEMICOLON || ret == DO_NOT_INSERT_SEMICOLON_SCAN_NEXT)
        && valid_symbols[TERNARY_QMARK] && lexer->lookahead == '?') {
      //return scan_ternary_qmark(lexer);
      if (scan_ternary_qmark(lexer)) {
        wprintf(L"return true 1\n");
        return true;
      } else {
        //wprintf(L"-----------------> implement me 1 <---------------, lookahead = %lc\n", lexer->lookahead);
        wprintf(L"return false 2\n");
        return false;
      }

    }

    if (ret == DO_NOT_INSERT_SEMICOLON_SCAN_NEXT && valid_symbols[IDENTIFIER]) {
      return scan_identifier(lexer);
    }

    //if (!ret) {
    //  wprintf(L"-----------------> implement me 2 <---------------, lookahead = %lc\n", lexer->lookahead);

    //  if (lexer->lookahead == 'i') {
    //    ret = scan_automatic_semicolon_started_with_i(lexer);
    //  } else {
    //    if (valid_symbols[IDENTIFIER]) {
    //      return scan_identifier(lexer);
    //    } else {
    //      return false;
    //    }
    //  }
    //}

    wprintf(L"scan_automatic_semicolon2 => %d, lookahead = %lc\n", ret, lexer->lookahead);
    switch (ret) {
    case INSERT_SEMICOLON:
      return true;
    case DO_NOT_INSERT_SEMICOLON_SCAN_NEXT:
    case DO_NOT_INSERT_SEMICOLON:
    default:
      return false;
    }

  }
  if (valid_symbols[IDENTIFIER]) {
    wprintf(L"scan_identifier started\n");
    return scan_identifier(lexer);
  }
  if (valid_symbols[NO_SPACE]) {
    wprintf(L"scan_no_space started\n");
    return scan_no_space(lexer);
  }
  //if (valid_symbols[IDENTIFIER] && valid_symbols[CSS_IDENTIFIER]) {
  //  #ifdef TREE_SITTER_DEBUG
  //  wprintf(L"css or js identifier\n");
  //  #endif
  //  return scan_css_or_js_identifier(lexer);
  //} else if (valid_symbols[IDENTIFIER]) {
  //  return scan_identifier(lexer);
  //} else if (valid_symbols[CSS_IDENTIFIER]) {
  //  return scan_css_identifier(lexer);
  //}
  if (valid_symbols[TERNARY_QMARK]) {
    wprintf(L"ternary mark\n");
    return scan_ternary_qmark(lexer);
  }
  return false;
}
