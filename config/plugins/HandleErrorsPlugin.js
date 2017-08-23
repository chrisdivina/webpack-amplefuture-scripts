const chalk = require('chalk');
const PrettyError = require('pretty-error');
const notifier = require('node-notifier');
const pe = new PrettyError();

function HandleErrorsPlugin(options) {
  this.options = options || {};
}

HandleErrorsPlugin.prototype.apply = function(compiler) {

  let that = this;

  compiler.plugin("after-compile", function(compilation, callback) {

    if (compilation.errors && compilation.errors.length) {

      notifier.notify({
        'title': 'There was an error during the build',
        'message': 'Please check the console for more information'
      }, function() {

        console.log('\n\n');
        console.log(chalk.redBright('  There was an error during the build.'));
        console.log();

        // Regardless how many errors we have,
        // we only display the very first error only to make it more readable
        var renderedError = pe.render(new Error(compilation.errors[0]));
        console.log(renderedError);

        process.exit(0);
      });

    } else {
      callback()
    }



  });

}

module.exports = HandleErrorsPlugin
