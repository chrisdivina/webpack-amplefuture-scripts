const chalk = require('chalk')
const paths = require('../config/paths')
const webpack = require('webpack')
const fs = require('fs')
const interface = require('../utils/interface')

// This is because we use it several times
const PROJECT_CONFIG_FILE_PATH = paths.resolve('./config/project.js');

// If the file doesn't exists, exit the script
if ( !fs.existsSync(PROJECT_CONFIG_FILE_PATH) ) {
    // TODO: add message for user
    console.log('Could not find config: ' + PROJECT_CONFIG_FILE_PATH);
}

// Require the config files now
const webpackConfig = require( '../config/webpack.dev.config' )
const project = require(PROJECT_CONFIG_FILE_PATH);

 // This is to improve readability
let { uploadAllowed = true } = project;
let uploadNotAllowed = !uploadAllowed;

// Allow upload if it was not previously
if ( uploadNotAllowed ) {
  project.uploadAllowed = true;
  let contents = 'module.exports = ' + util.inspect(project, false, null);
  fs.writeFile(PROJECT_CONFIG_FILE_PATH, contents, runWebpack);
} else {
  runWebpack();
}

// This method handles the exit process
// Before exiting in development mode, we prompt the user if they want to
// create a production build
function listenForExitEvent() {

  // Workaround to handle SIGINT for windows
  if (process.platform === "win32") {
      var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.on("SIGINT", function () {
        interface.askToBuildForProduction();
      });
    }

  // For all others
  process.on("SIGINT", function () {
    interface.askToBuildForProduction();
  });

}

/*
* Run webpack
*/
function runWebpack() {

  // Create the compiler
  let compiler = webpack(webpackConfig);

  // Needed for notification
  let isFirstBuild = true;

  compiler.watch({
    ignored: /node_modules/,
    poll: true
  }, function(err, stats) {

    listenForExitEvent();

    // When it is the first build, we notify the user that webpack is ready
    if ( isFirstBuild ) {
      isFirstBuild = false;
      interface.notifyWebpackReady();
    }

    // Clear the console at the beginning of each compilation
    compiler.plugin('this-compilation', interface.clearConsole);

    // Notify user at the end of each compilation
    compiler.plugin('done', interface.notifyWebpackDone );

  });

}
