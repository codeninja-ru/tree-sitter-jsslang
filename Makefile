SHELL=/bin/bash
TREE_SITTER=./node_modules/.bin/tree-sitter

.PHONY: test

gen:
	$(TREE_SITTER) generate
test: gen
	$(TREE_SITTER) test
update: gen
	$(TREE_SITTER) test --update

deps:
#	mkdir -p ./src/tree_sitter
#	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/src/scanner.c -O ./src/javascript_scanner.c
#	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-css/master/src/scanner.c -O ./src/css_scanner.c
#	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/src/tree_sitter/parser.h -O ./src/tree_sitter/parser.h
	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/grammar.js -O ./javascript.js
	rm -rf /tmp/javascript
	rm -rf /tmp/css
	mkdir -p /tmp/javascript
	wget https://codeload.github.com/tree-sitter/tree-sitter-javascript/tar.gz/master -O - | tar -xzv -C /tmp/javascript --strip=2 "tree-sitter-javascript-master/test"
	mkdir -p /tmp/css
	wget https://codeload.github.com/tree-sitter/tree-sitter-css/tar.gz/master -O - | tar -xzv -C /tmp/css --strip=2 "tree-sitter-css-master/corpus"
	find /tmp/javascript -type f -exec bash -c 'mv $$0 $${0%/*}/javascript_$${0##*/}' {} \;
	find /tmp/css -type f -exec bash -c 'mv $$0 $${0%/*}/css_$${0##*/}' {} \;
	mkdir -p ./test/corpus/css
	mkdir -p ./test/corpus/javascript
	cp -r /tmp/javascript/corpus/* ./test/corpus/javascript
	cp -r /tmp/javascript/highlight/* ./test/highlight
	cp -r /tmp/css/* ./test/corpus/css
#	rm -rf /tmp/javascript
#	rm -rf /tmp/css

parse: gen
#	$(TREE_SITTER) parse -d /tmp/test.jss
	$(TREE_SITTER) parse -D /tmp/test.jss
