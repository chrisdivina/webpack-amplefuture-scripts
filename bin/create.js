#! /usr/bin/env node
'use strict';
const fs = require('fs')
const path = require('path')
const { display } = require('../utils/interface')
const chalk = require('chalk')
const sftp = require('../utils/sftp')
const inquirer = require('inquirer')
const pd = require('pretty-data').pd;
const PrettyError = require('pretty-error');
const pe = new PrettyError();
const { spawn  } = require('child_process');

// We set up some constants
const CONFIG_FILE = 'project.config.json';
const PROJECT_DIR = process.cwd()
const CONFIG_ABS_PATH = path.join( PROJECT_DIR, CONFIG_FILE)
const PACKAGE_JSON_ABS_PATH = path.join( PROJECT_DIR, 'package.json')


display( function() {

  let confirmMessage = chalk.red('It seems like a project config has already been set up.') +  ' Are you sure you want to continue anyway?';
  const configExists = fs.existsSync(CONFIG_ABS_PATH) && fs.existsSync(PACKAGE_JSON_ABS_PATH);
  const configMissing = !fs.existsSync(CONFIG_ABS_PATH) || !fs.existsSync(PACKAGE_JSON_ABS_PATH);

  // Prompt the questions
  inquirer.prompt([
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
      name: 'assetsDir',
      message: 'Assets folder: ',
      default: 'assets',
      when: answers => answers.continue || configMissing,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'host',
      message: 'SFTP Host: ',
      when: answers => answers.continue || configMissing,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'username',
      message: 'SFTP Username: ',
      when: answers => answers.continue || configMissing,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'password',
      message: 'SFTP Password: ',
      when: answers => answers.continue || configMissing,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'remotePath',
      message: 'SFTP Remote Path: ',
      when: answers => answers.continue || configMissing,
      validate: input => input !== ''
    },
    {
      type: 'input',
      name: 'port',
      message: 'SFTP Port: ',
      default: '22',
      when: answers => answers.continue || configMissing,
    },
  ]).then(function(answers) {

    // Exit script if asked by user
    if (!answers.continue && configExists) {
      process.exit(0);
    }

    // Remove the continue property as it's not needed anymore
    delete answers.continue;
    let { assetsDir, host, username, password, remotePath, port } = answers;

    console.log( '\n\n  Testing server connection...' )

    // We test the connection
    sftp.test(host, username, password, port, function(err) {

      if (err) {
        console.log(pe.render(new Error(err)))
        process.exit(1);
      }

      console.log( chalk.greenBright('  Connection was successful.\n') )

      const config = {
        host,
        username,
        password,
        remotePath,
        port,
        remoteFolder: assetsDir,
        src: path.join( './', assetsDir),
        build: path.join('../', assetsDir)
      }
      // If successful
      createConfigFile(config, function() {
        if ( fs.existsSync( PACKAGE_JSON_ABS_PATH) ) {
          // If the file exists, we read it first
          // And then we call updateContent(err, data)
          fs.readFile(PACKAGE_JSON_ABS_PATH, 'utf8', updatePackageJson);
        } else {
          // We don't need to read it, and can create a new one
          // We can call update content without params
          // The params will be initialised by the function itself
          createPackageJson();
        }
      });
    });

  });

})

function createConfigFile(config, callback) {

  // Prettify the json string
  let content = pd.json(config);

  fs.writeFile(CONFIG_ABS_PATH, content, callback);

}

function updatePackageJson(err = null, data = "") {

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
  fs.writeFile(PACKAGE_JSON_ABS_PATH, content, installPackages);

}

function createPackageJson() {

  let config = {}
  let scripts = {}

  // We add the start script
  scripts.start = "webpack-amplefuture-scripts";

  // update the scripts in the config
  config.scripts = scripts;

  // Prettify the json string
  let content = pd.json(config);

  // Write the new json in package.json
  // And start installing packages
  fs.writeFile(PACKAGE_JSON_ABS_PATH, content, installPackages);

}

function installPackages() {

  console.log('\n  Setting up the project...');
  console.log( chalk.gray('  (This might take a while so you might want to grab a cuppa...)\n'));

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
      display(endCreation);
    }
  });

}

function endCreation() {
  console.log(chalk.greenBright('  Congratulations!'));
  console.log('  The project is now set up for you.')
  console.log( '\n  Please run ' + chalk.cyanBright.inverse(' npm start ') + ' to run webpack');
  process.exit(0);
}
