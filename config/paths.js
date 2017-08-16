const path = require('path');

// We store the current working directory (root of the project)
const rootDir = process.cwd();

// Return the absolute path of a file relative to working directory
const resolve = filepath => path.join( rootDir, filepath );

module.exports = {
  rootDir,
  srcDir: resolve('./assets'),
  buildDir: resolve('../assets'),
  resolve
}
