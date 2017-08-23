const chalk = require('chalk')
const webpack = require('webpack')
const interface = require('../utils/interface')
const config = require('../config/webpack.dev.config');
const notifier = require('node-notifier');

// Create the compiler
let compiler = webpack(config);

/*
* This makes sure that we doesn't leave the script without building a
*  bundle for production
*/
// Workaround to handle SIGINT for windows
if (process.platform === "win32") {

  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function() {
    interface.display(buildProd);
  });

} else {
  // For all others
  process.on("SIGINT", function() {
    interface.display(buildProd);
  });
}

console.log('\n\n  The first build might take a while to compile...\n');

compiler.watch({
  ignored: /node_modules/,
  poll: true
}, function(err, stats) {

  // Clear the console at the beginning of each compilation
  compiler.plugin('before-compile', function(params, callback) {
    interface.display(function() {
      console.log('\n  Building new assets...\n');
      callback();
    });
  });

});


// Compile the production build
function buildProd() {
  const config = require('../config/webpack.prod.config')
  const compiler = webpack(config);
  console.log('  Creating bundle for production before exiting..\n');
  compiler.run( function() {
    notifier.notify({
      'title': 'Build was successful'
    }, function() {
      process.exit(0);
    });
  });
}
