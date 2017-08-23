const fs = require('fs')

function FilterOutputPlugin(whitelist) {
  this.whitelist = whitelist;
}

FilterOutputPlugin.prototype.apply = function(compiler) {
  let { whitelist = [] } = this;

  compiler.plugin('emit', function(compilation, callback) {
    Object.keys(compilation.assets).forEach( (name) => {
      if (whitelist.indexOf(name) === -1) {
        delete compilation.assets[name];
      }
    })
    callback()
  });

}

module.exports = FilterOutputPlugin
