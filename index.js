#! /usr/bin/env node

'use strict';

const inquirer = require('inquirer');
const chalk = require('chalk')
const fs = require('fs');
const util = require('util')
const client = require('scp2')
const path = require('path')
const clearConsole = require('react-dev-utils/clearConsole')
const { display } = require('./utils/interface')
const sftp = require('./utils/sftp');

// Constants that we will use later in the file
const DEVELOPMENT = 'development'
const PRODUCTION = 'production'
const CONFIG_FILE = 'project.config.json';
const DEV_ANSWER = 'Development ' + chalk.grey('(watch changes, faster, no minification)')
const PROD_ANSWER = 'Production ' + chalk.grey('(one build, slower)')

// Display title and questions
// Depending on the answers to this questions, we will run the releavant script
display( function() {
  inquirer.prompt(questions).then(handleAnswers);
});

// We set up the list of questions where we need answers for
// in order to start the relevant script
const questions = [
  // We first choose between development and Production mode
  {
    type: 'list',
    name: 'mode',
    message: 'Which environment do you want to run?',
    choices: [
      DEV_ANSWER,
      PROD_ANSWER
    ],
  },
  // We only show the following question in development mode
  // This has been requested by some users
  // However, we always upload in production mode
  {
    type: 'confirm',
    name: 'upload',
    message: 'Automatically upload generated files to dev server?',
    when: answers => answers.mode === DEV_ANSWER
  }

]

// We set up the callback which will execute the relevant script
// depending on the answers to the questions we set up (see above)
const handleAnswers = function(answers) {

  // Do this as the first thing so that any code reading it knows the right env.
  const env = (answers.mode === DEV_ANSWER) ? DEVELOPMENT : PRODUCTION;
  process.env.BABEL_ENV = env
  process.env.NODE_ENV = env

  // Path of the script to run
  const script = './scripts/' + env;

  // Set the upload environment
  const { upload = true } = answers;
  process.env.AMPLEFUTURE_UPLOAD = upload

  if (upload) {
    // Check the config before continuing
    checkSftpConfig( function(err) {

      if (err) {
        // Prevent uploads on connection error
        console.log( chalk.yellowBright('\n Uploads to the server are not possible right now. Please check your configuration in ' + CONFIG_FILE + '\n') );
        process.env.AMPLEFUTURE_UPLOAD = false;
        callback();
      }

      require(script);

    })
  } else {
    require(script);
  }

};

// Check that the sftp config is working
function checkSftpConfig(callback) {

  // get the config file
  let root = process.cwd();
  let configFile = path.join(root, CONFIG_FILE);

  // If the config file does not exist, display a warning and prevent uploading
  if ( !fs.existsSync(configFile) ) {
    console.log( chalk.yellowBright('\n' + CONFIG_FILE + ' is missing. Uploads to dev server will not be possible\n') );
    process.env.AMPLEFUTURE_UPLOAD = false;
    callback();
  } else {
    // Otherwise test the config
    fs.readFile(configFile, function(err, json) {
      let config = JSON.parse(json);
      let { host, username, password, port } = config;
      sftp.test(host, username, password, port, callback);
    });
  }

}
