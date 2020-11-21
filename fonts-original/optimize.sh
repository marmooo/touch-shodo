# pip install fonttools
pyftsubset $1 --text-file=optimize.txt --layout-features='*' --flavor=woff2 --output-file=$1.new
