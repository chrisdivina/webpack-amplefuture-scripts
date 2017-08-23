const inquirer = require('inquirer');
const isInteractive = process.stdout.isTTY;
const notifier = require('node-notifier');
const chalk = require('chalk');
const clearConsole = require('react-dev-utils/clearConsole');
const figlet = require('figlet');

const notifyWebpackReady = function() {
  notifier.notify({
    'title': 'Webpack is ready',
    'message': 'You can now start editing your code'
  });
}

const notifyWebpackDone = function() {
  notifier.notify({
    'title': 'Please refresh your browser',
    'message': 'The generated files have now been uploaded'
  });
}

const clear = function() {
  if (isInteractive) {
    clearConsole();
  }
}

const display = function( callback ) {

  // First clear the console
  clearConsole()

  // Run figlet for styling purposes
  // Figlet requires a callback to display our fancy title
  // see https://www.npmjs.com/package/figlet
  figlet( 'Amplefuture', function(err, data) {
    if (!err) {
      // Displaying fancy title
      console.log( chalk.yellow(data)  + '\n' )
      callback();
    }
  });

}

module.exports = {
  notifyWebpackReady,
  notifyWebpackDone,
  clearConsole: clear,
  display
}
