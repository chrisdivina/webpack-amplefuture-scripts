'use strict'

const chalk = require('chalk')
const config = require('../config/weback.dev-no-upload.config')

const compiler = webpack(config);

const watchOptions = {
  poll: 1000
}

const watchCallback = (err, stats) => {

  if (err) {
    console.log( chalk.red(err) );
    process.exit(0);
  }

  console.log( chalk.cyan('Watching for file changes...') );
}

compiler.watch( watchOptions, watchCallback )
