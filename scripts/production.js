const chalk = require('chalk')
const config = require('../config/webpack.prod.config')
const webpack = require('webpack')
const interface = require('../utils/interface')

const compiler = webpack(config);

console.log();

compiler.run( (err, stats) => {

  if (err) {
    // Ouput errors if any
    console.log( chalk.red(err) );
    process.exit(1);
  }

  // Notify user at the end of each compilation
  compiler.plugin('done', function() {
    interface.notifyWebpackDone;
    if (process.env.EXIT_ON_DONE) {
      process.exit(0);
    }
  })

})
