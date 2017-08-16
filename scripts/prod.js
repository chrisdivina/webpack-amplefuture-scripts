'use strict'

const chalk = require('chalk')
const config = require('../config/weback.prod.config')

const compiler = webpack(config);

compiler.run( (err, stats) => {

  if (err) {
    console.log( chalk.red(err) );
  }

  process.exit(0);

})
