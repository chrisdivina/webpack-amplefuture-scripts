'use strict';

const inquirer = require('inquirer');
const clear = require('clear')
const chalk = require('chalk')
const figlet = require('figlet');
const fs = require('fs');
const util = require('util')
const client = require('scp2')
const paths = require('../config/paths');

// Constants that we will use later in the file
const TITLE = 'Amplefuture'
const DEVELOPMENT = 'development'
const PRODUCTION = 'production'

const projectConfigFile = paths.resolve('./config/project.js');

// Set the answers to the questions
const DEV_ENV = 'Development ' + chalk.grey('(watch changes, faster, no minification)')
const PROD_ENV = 'Production ' + chalk.grey('(one build, slower)')


const projectQuestions = [
  {
    type: 'confirm',
    name: 'project',
    message: chalk.red('The project configuration file is missing') + ' Do you want to create it?',
  },
  {
    type: 'input',
    name: 'srcDirectory',
    message: 'Source folder: ',
    default: './assets',
    when: (answers) => answers.project,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'buildDirectory',
    message: 'Build folder: ',
    default: '../assets',
    when: (answers) => answers.project,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'host',
    message: 'SFTP Host: ',
    when: (answers) => answers.project,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'username',
    message: 'SFTP Username: ',
    when: (answers) => answers.project,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'password',
    message: 'SFTP Password: ',
    when: (answers) => answers.project,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'remotePath',
    message: 'SFTP Remote Path: ',
    when: (answers) => answers.project,
    validate: input => input !== ''
  },
  {
    type: 'input',
    name: 'port',
    message: 'SFTP Port: ',
    default: '22',
    when: (answers) => answers.project,
  },
];

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
    when: answers => answers.mode === DEV_ENV && fs.existsSync(projectConfigFile)
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

function display( callback ) {

  // First clear the console
  clear()

  // Run figlet for styling purposes
  // Figlet requires a callback to display our fancy title
  // see https://www.npmjs.com/package/figlet
  figlet( TITLE, function(err, data) {

    if (!err) {
      // Displaying fancy title
      console.log( chalk.yellow(data)  + '\n' )

      callback();
    }

  });

}

function testConnection(host, username, password, port, callback) {

  client.defaults({
    port,
    host,
    username,
    password
  });

  client.on('error', function(err) {
    console.log( chalk.red('\nCould not connect to server.\n') )
    console.log( '\n1) Please check your config file: ' + projectConfigFile )
    console.log( '\n2) If you are behind a proxy, please check that npm is set up correctly: https://jjasonclark.com/how-to-setup-node-behind-web-proxy/' )
    console.log( '\n3) If it is all fine, please check your internet connection')
    console.log( '\n\n' )
  });

  client.sftp( function(err) {

    if (!err) {
      client.close();
      callback();
    }

  });

}

const handleProjectAnswers = function(answers) {

  let { project, srcDirectory, buildDirectory, host, username, password, remotePath, port } = answers;

  if ( project ) {

    testConnection( host, username, password, port, function() {

      // Write the configuration in a file
      let config = { srcDirectory, buildDirectory, host, username, password, remotePath, port };
      let contents = 'module.exports = ' + util.inspect(config, false, null);
      fs.writeFile(projectConfigFile, contents, function() {

        // Inform user that the configuration has been successful
        console.log('\nThe configuration file was successfully created: ' + projectConfigFile + '\n');

        // Ask user if they want to run wepback now
        console.log( (new inquirer.Separator()).line + '\n');
        inquirer.prompt([
          {
            type: 'confirm',
            name: 'start',
            message: 'Would you like to run the script now?'
          }
        ]).then( function(answers) {

          // If user asks to run the script
          if (answers.start) {
            display( () => inquirer.prompt(envQuestions).then(handleEnvAnswers) )
          }

        });

      });

    });

  }

};

display( function() {

  if ( !fs.existsSync(projectConfigFile) ) {
    inquirer.prompt(projectQuestions).then(handleProjectAnswers);
  } else {
    let config = require('../config/project.js');
    let { host, username, password, port } = config;
    testConnection(host, username, password, port, function() {
      inquirer.prompt(envQuestions).then(handleEnvAnswers);
    });
  }

});
