'use strict';

const inquirer = require('inquirer');
const clear = require('clear')
const chalk = require('chalk')
const figlet = require('figlet');
const fs = require('fs');
const util = require('util')
const paths = require('../config/paths');

// Constants that we will use later in the file
const TITLE = 'Amplefuture'
const DEVELOPMENT = 'development'
const PRODUCTION = 'production'

const sftpConfigFile = paths.resolve('./config/sftp.js');

// Set the answers to the questions
const DEV_ENV = 'Development ' + chalk.grey('(watch changes, faster, no minification)')
const PROD_ENV = 'Production ' + chalk.grey('(one build, slower)')


const sftpQuestions = [
  {
    type: 'confirm',
    name: 'create',
    message: chalk.red('The sftp configuration file is missing.') + ' Do you want to create it?',
  },
  {
    type: 'input',
    name: 'host',
    message: 'Host: ',
    when: (answers) => answers.create,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'username',
    message: 'Username: ',
    when: (answers) => answers.create,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'password',
    message: 'Password: ',
    when: (answers) => answers.create,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'remote',
    message: 'Remote Path: ',
    when: (answers) => answers.create,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'port',
    message: 'Port: ',
    default: '22',
    when: (answers) => answers.create,
  },
]

// We set up the list of questions where we need answers for
// in order to start the relevant script
const envQuestions = [
  // We first choose between development and Production mode
  {
    type: 'list',
    name: 'mode',
    message: 'Which environment do you want to run?',
    choices: [
      DEV_ENV,
      PROD_ENV
    ],
  },
  // We only show the following question in development mode
  // This has been requested by some users
  {
    type: 'confirm',
    name: 'upload',
    message: 'Automatically upload generated files to dev server?',
    when: answers => answers.mode === DEV_ENV && fs.existsSync(sftpConfigFile)
  }

]

// We set up the callback which will execute the relevant script
// depending on the answers to the questions we set up (see above)
const handleEnvAnswers = function(answers) {

  const env = (answers.mode === DEV_ENV) ? DEVELOPMENT : PRODUCTION;
  const { upload = true } = answers;

  // Do this as the first thing so that any code reading it knows the right env.
  process.env.BABEL_ENV = env
  process.env.NODE_ENV = env

  // Select the script to run
  let script = '';
  if ( env === DEVELOPMENT && upload ) {
    script = './dev'
  } else if ( env === DEVELOPMENT) {
    script = './dev-no-upload'
  } else {
    script = './prod'
  }

  // run the script
  require(script);

};

const handleSftpAnswers = function(answers) {

  let { create, host, username, password, remotePath, port } = answers;

  if ( create ) {
    let config = { host, username, password, remotePath, port };
    let contents = 'module.exports = ' + util.inspect(config, false, null);
    fs.writeFileSync(sftpConfigFile, contents);
    console.log( chalk.green('\nThe sftp configuration file has now been created. \nYou can also edit it: ' + sftpConfigFile + '\n'));
  } else {
    console.log( chalk.yellow('\nThe sftp configuration file does not exist. Your files will not be uploaded to the dev server.\n') )
  }

  console.log( '\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\n');

  inquirer.prompt(envQuestions).then(handleEnvAnswers);

};

// First clear the console
clear()

// Run figlet for styling purposes
// Figlet requires a callback to display our fancy title
// see https://www.npmjs.com/package/figlet
figlet( TITLE, function(err, data) {

  // Displaying fancy title
  console.log( chalk.yellow(data)  + '\n' )

  if ( !fs.existsSync(sftpConfigFile) ) {
    inquirer.prompt(sftpQuestions).then(handleSftpAnswers);
  } else {
    inquirer.prompt(envQuestions).then(handleEnvAnswers);
  }

});
