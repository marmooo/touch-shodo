cp -r graded-kanji-examples/dist/* src/data
cp -r fonts src
mkdir -p docs
cp -r src/* docs
minify -r src -o docs

