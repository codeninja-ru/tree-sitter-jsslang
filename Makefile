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
	mkdir -p ./src/tree_sitter
	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/src/scanner.c -O ./src/javascript_scanner.c
	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-css/master/src/scanner.c -O ./src/css_scanner.c
	wget https://raw.githubusercontent.com/tree-sitter/tree-sitter-javascript/master/src/tree_sitter/parser.h -O ./src/tree_sitter/parser.h
	rm -rf ./test/javascript
	rm -rf ./test/css
	mkdir -p ./test/javascript
	wget https://codeload.github.com/tree-sitter/tree-sitter-javascript/tar.gz/master -O - | tar -xzv -C ./test/javascript --strip=2 "tree-sitter-javascript-master/test"
	mkdir -p ./test/css
	wget https://codeload.github.com/tree-sitter/tree-sitter-css/tar.gz/master -O - | tar -xzv -C ./test/css --strip=2 "tree-sitter-css-master/corpus"
	find ./test/css -type f -exec bash -c 'mv $$0 $${0%/*}/css_$${0##*/}' {} \;
	find ./test/javascript -type f -exec bash -c 'mv $$0 $${0%/*}/javascript_$${0##*/}' {} \;
	cp -r ./test/javascript ./test/corpus/.
	cp -r ./test/css ./test/corpus/.
	rm -rf ./test/javascript
	rm -rf ./test/css

parse: gen
	$(TREE_SITTER) parse -d /tmp/test.jss
