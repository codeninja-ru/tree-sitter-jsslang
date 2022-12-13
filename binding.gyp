{
  "targets": [
    {
      "target_name": "tree_sitter_jsslang_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "src"
      ],
      "sources": [
        "src/parser.c",
        "src/javascript_scanner.c",
        "src/css_scanner.c",
        "bindings/node/binding.cc"
      ],
      "cflags_c": [
        "-std=c99",
      ]
    }
  ]
}
