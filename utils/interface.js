const inquirer = require('inquirer');
const isInteractive = process.stdout.isTTY;
const notifier = require('node-notifier');
const chalk = require('chalk');
const clearConsole = require('react-dev-utils/clearConsole');

const askToBuildForProduction = function() {

  const handle = function(answers) {

    if ( 'Yes' === answers.rebuild ) {
      require('../scripts/build-prod');
    } else {
      process.exit(0);
    }

  }

  const questions = [
    {
      type: 'list',
      name: 'rebuild',
      message: 'Would you like to create a build for production before leaving?',
      choices: [
        new inquirer.Separator(),
        'Yes',
        'No'
      ]
    }
  ];

  clear();
  inquirer.prompt(questions, handle);

}

const notifyWebpackReady = function() {
  notifier.notify({
    'title': 'Webpack is ready',
    'message': 'You can now start editing your code'
  });
  console.log(chalk.cyan('Webpack is now watching for file changes...\n'));
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

module.exports = {
  askToBuildForProduction,
  notifyWebpackReady,
  notifyWebpackDone,
  clearConsole: clear
}
