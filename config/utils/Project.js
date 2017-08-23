const path = require('path')
const fs = require('fs')
const chalk = require('chalk');

const CONFIG_FILE = 'project.config.json';
const ROOT = process.cwd()

function Project() {

  // Make sure we've read the config file before continuing
  // The config is stored in the config property
  this.readConfig();
  this.setPaths();
  this.setIO();
}

// Read the config file
Project.prototype.readConfig = function() {
  let configFile = path.join(ROOT, CONFIG_FILE);
  let json = fs.readFileSync(configFile);
  this.config = JSON.parse(json);
}

// Create the paths for the source folder and the build folder
Project.prototype.setPaths = function() {
  let { src, build } = this.config;
  let paths = {};

  // Create the path to the source folder and build folder
  paths.src = path.join(ROOT, src);
  paths.build = path.join(ROOT, build);

  this.paths = paths;

}

// set the entries for the project
Project.prototype.setIO = function() {

  let { paths } = this;

  // We store the list of filenames in both directories
  // We need to compare those two lists later on
  const srcFiles= listFiles(paths.src);
  const buildFiles = listFiles(paths.build);

  // We compare both list of filenames
  // And return the intersection between them two
  const commonFiles = findCommonFiles(srcFiles, buildFiles);

  let entries = {}
  let whitelist = [];
  let extension = '';
  let name = '';

  // Once we have the entry paths
  // We process them and turn them in a object
  // That can be used by the webpack option `entry`
  commonFiles.forEach( function(file) {

    // To improve readability
    extension = getExtension(file);

    // Transform the filepath to get the name
    // For example, if the filepath is `./js/my-file.js`
    // The name will be: `js/my-file`
    name = file.replace( './', '' ).replace( '.' + extension, '');
    filename = path.join(paths.src, file)

    // Add this entry to the list of entries
    entries[name] = filename;

    // // This is the name that this entry should have when it's emitted
    outputExtension = ('scss' === extension || 'sass' === extension ) ? 'css' : extension;
    outputName = name + '.' + outputExtension

    whitelist.push(outputName);
    whitelist.push(outputName + '.map') // include maps in the whitelist

  });

  this.entries = entries
  this.whitelist = whitelist

}


// // Returns the file paths in this directory
// // see https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search?answertab=votes#tab-top
// // @param dir
// // @return array
function walkDirectory(dir) {

    var results = [];

    if ( !fs.existsSync(dir) ) {
      console.log( chalk.redBright('  The following folder does not exists: ') + dir + ('\n') );
      process.exit(1);
    }

    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file
        var stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walkDirectory(file))
        else results.push(file)
    })

    return results
};

// // Returns the list of relative file path in a specific directory
// // @param directory   directory path
// // @return array
const listFiles = (directory) => walkDirectory(directory).map( filename => filename.replace(directory, '') );

// /* destructively finds the intersection of
//  * two arrays in a simple fashion.
//  *
//  * PARAMS
//  *  a - first array, must already be sorted
//  *  b - second array, must already be sorted
//  *
//  * NOTES
//  *  State of input arrays is undefined when
//  *  the function returns.  They should be
//  *  (prolly) be dumped.
//  *
//  *  Should have O(n) operations, where n is
//  *    n = MIN(a.length, b.length)
//  */
function intersection_destructive(a, b)
{
  var result = [];
  while( a.length > 0 && b.length > 0 )
  {
     if      (a[0] < b[0] ){ a.shift(); }
     else if (a[0] > b[0] ){ b.shift(); }
     else /* they're equal */
     {
       result.push(a.shift());
       b.shift();
     }
  }

  return result;
}

const getExtension = filename => filename.split('.').pop();

const findCommonFiles = function( source, destination ) {

   // retrive only the CSS files available in destination folder
   let css = destination.filter( filename => 'css' === getExtension(filename) );

   // Turn this list into sass files and scss files
   // This is to be able to test against the source folder
   // (if we use .sass or .scss files for example)
   let sass = css.map( filename => filename.replace('css', 'sass') );
   let scss = css.map( filename => filename.replace('css', 'scss') );

   // Adds the sass and scss list of files to the list of destination files
   destination = destination.concat(sass, scss);

   // Find the similar files between source and destination
   return intersection_destructive(source.sort(), destination.sort());

}

module.exports = Project
