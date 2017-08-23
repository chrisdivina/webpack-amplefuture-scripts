#! /usr/bin/env node
'use strict';
const fs = require('fs')
const path = require('path')
const paths = require('../utils/paths')
const ui = require('../utils/interface')
const chalk = require('chalk')
const Connection = require('../utils/connection')
const inquirer = require('inquirer')
const pd = require('pretty-data').pd;
const { spawn  } = require('child_process');

// We set up some constants
const PROJECT_DIR = paths.projectDirectory
const CONFIG_FILENAME = 'project.config.json';
const CONFIG_ABS_PATH = path.join( PROJECT_DIR, CONFIG_FILENAME)
const PACKAGE_JSON_ABS_PATH = path.join( PROJECT_DIR, 'package.json')

// We display the initial screen
ui.display(prompt);

function prompt() {

  let confirmMessage = chalk.red('It seems like a project config has already been set up.') +  ' Are you sure you want to continue anyway?';

  // This is the list of questions that we ask the user about the project
  const questions = [
    {
      // If the project is already set up, we get confirmation from the user that
      // they want to overwrite the current config
      type: 'confirm',
      name: 'continue',
      message: chalk.red('It seems like a project config has already been set up.') +  ' Are you sure you want to continue anyway?',
      when: () => fs.existsSync(CONFIG_ABS_PATH) && fs.existsSync(PACKAGE_JSON_ABS_PATH),
    },
    {
      type: 'input',
      name: 'srcDirectory',
      message: 'Source folder: ',
      default: 'assets',
      when: answers => answers.continue,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'host',
      message: 'SFTP Host: ',
      when: answers => answers.continue,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'username',
      message: 'SFTP Username: ',
      when: answers => answers.continue,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'password',
      message: 'SFTP Password: ',
      when: answers => answers.continue,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'remotePath',
      message: 'SFTP Remote Path: ',
      when: answers => answers.continue,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'port',
      message: 'SFTP Port: ',
      default: '22',
      when: answers => answers.continue,
    },
  ];

  // We handle the answers here
  // We make sure that the connection
  function handleAnswers(answers) {

    // Exit script if asked by user
    if (!answers.continue) {
      process.exit(0);
    }

    // Remove the continue property as it's not needed anymore
    delete answers.continue;
    let { srcDirectory, host, username, password, remotePath, port } = answers;

    // Create a new connection object
    let conn = new Connection(host, username, password, port);

    // We test the connection
    conn.test( function() {
      // If successful
      createConfigFile(answers, updatePackageJson);
    });

  };

  // Prompt the questions
  inquirer.prompt(questions).then(handleAnswers);

}



function createConfigFile(config, callback) {

  // Prettify the json string
  let content = pd.json(config);

  fs.writeFile(CONFIG_ABS_PATH, content, callback);

}

function updateContent(err = null, data = "") {

  // Parse the json string
  // If the string is empty, it will return an empty object
  let config = JSON.parse(data);

  // We make sure that the scripts object exists
  let { scripts = {} } = config;

  // We update the start script
  scripts.start = "webpack-amplefuture-scripts";

  delete scripts.test;

  // update the scripts in the config
  config.scripts = scripts;

  // Prettify the json string
  let content = pd.json(config);

  // Write the new json in package.json
  // And start installing packages
  fs.writeFile(PACKAGE_JSON_ABS_PATH, content, function() {
    ui.display(installPackages);
  });

}

function installPackages() {

  console.log('\nSetting up the project...');
  console.log('(This might take a while so you might want to grab a cuppa...)\n');

  let command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

  let args = [
    'install',
    'webpack-amplefuture-scripts',
    '--save-dev'
  ];

  let options = {
    cwd: PROJECT_DIR,
    stdio: 'inherit' // this is to display the output of parent process
  };

  const child = spawn(command, args, options);

  child.on('exit', function (code) {
    if ( code === 0 ) {
      ui.display(endCreation);
    }
  });

}

function endCreation() {
  console.log( chalk.green('\nAlright, the project is all set up for you!\n'));
  console.log( 'Please run ' + chalk.inverse(' npm start ') + ' and enjoy the ride.\n');
  process.exit(0)
}

// This update the package Json file
function updatePackageJson() {

  if ( fs.existsSync( PACKAGE_JSON_ABS_PATH) ) {
    // If the file exists, we read it first
    // And then we call updateContent(err, data)
    fs.readFile(PACKAGE_JSON_ABS_PATH, 'utf8', updateContent);
  } else {
    // We don't need to read it, and can create a new one
    // We can call update content without params
    // The params will be initialised by the function itself
    updateContent();
  }

}
