const path = require('path');
const fs = require('fs');
// const url = require('url');
// const sftp = require('./sftp');
//
// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const projectDirectory = fs.realpathSync(process.cwd());
const resolve = relativePath => path.resolve(projectDirectory, relativePath);

// // Returns the file path relative to a directory
// // @param filename    absolute path of the file
// // @param directory   directory path
// // @return string
const relativise = absolutePath => filename.replace( projectDirectory, '.');


const requireAbsolute = relativePath => require( resolve(relativePath) );

// // Returns the file paths in this directory
// // see https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search?answertab=votes#tab-top
// // @param dir
// // @return array
function walkDirectory(dir) {
    var results = [];
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
const getFilesInDirectory = (directory) => walkDirectory(directory).map( filename => getRelativePath(filename, directory) );

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

const getEntryPaths = function( source, destination ) {

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

const getAbsolutePaths = (root, paths) => paths.map( filepath => path.join(root, filepath) );

// Assumes that srcDirectory and buildDirectory are absolutePath
const getEntries = function(srcDirectory, buildDirectory) {

  // We store the list of filenames in both directories
  // We need to compare those two lists later on
  const srcFiles= getFilesInDirectory(srcDirectory);
  const buildFiles = getFilesInDirectory(buildDirectory);

  // We compare both list of filenames
  // And return the intersection between them two
  const entryPaths = getEntryPaths(srcFiles, buildFiles);

  let entries = {};
  let extension = '';
  let name = '';

  // Once we have the entry paths
  // We process them and turn them in a object
  // That can be used by the webpack option `entry`
  entryPaths.forEach( function(filepath) {

    // To improve readability
    extension = getExtension(filepath);

    // Transform the filepath to get the name
    // For example, if the filepath is `./js/my-file.js`
    // The name will be: `js/my-file`
    name = filepath.replace( './', '' ).replace( '.' + extension, '');

    // Add this entry to the list of entries
    entries[name] = filepath;

  });

  return entries

}

const getOutputs = function(entries) {

  let outputs = [];
  let extension = '';
  let filename = '';

  Object.keys(entries).forEach( function(name) {
    filename = entries[name]
    extension = getExtension(filename);
    filename = filename.replace( './', '' );

    if ( 'scss' === extension ) {
      filename = filename.replace( extension, 'css');
    }

    outputs.push(filename);
    outputs.push(filename + '.map');

  });

  return outputs;

}

// const outputs = getOutputs(entries);
//
// const remoteAssets = path.join(sftp.remotePath, './assets');
//

let projectDir = path.join(__dirname, '../');

module.exports = {
  // devPath: absolutePath('./'),
  // devJsPath: absolutePath('./js'),
  // devCssPath: absolutePath('./styles'),
  // entries,
  // outputs,
  // localAssets,
  // remoteAssets
  projectDirectory,
  resolve,
  relativise,
  getEntries,
  require: requireAbsolute
}
