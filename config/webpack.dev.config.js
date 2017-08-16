const paths = require('./paths');

module.exports = {
  // No sourcemap is generated in the development mode
  // Sourcemaps are only generated in the production mode (see relevant file)
  devtool: false,
  entry: paths.entry

}
