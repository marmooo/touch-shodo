const execSync = require('child_process').execSync;
const glob = require('glob');

console.log(__dirname);

glob('*.woff2', (err, paths) => {
  paths.forEach(path => {
    console.log(path);
    var new_path = '../fonts/' + path;
    // pip install fonttools
    execSync(`pyftsubset ${path} --text-file=optimize.txt --layout-features='*' --flavor=woff2 --output-file=${new_path}    `, { cwd:__dirname });
  });
});
