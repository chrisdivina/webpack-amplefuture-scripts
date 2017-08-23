const client = require('scp2');
const path = require('path');
const chalk = require('chalk');

function SftpOutputPlugin(options) {
  this.startTime = Date.now();
  this.chunkVersions = {};
  this.host = options.host;
  this.username = options.username;
  this.password = options.password;
  this.port = options.port || '22';
  this.remotePath = options.remotePath;
  this.localPath = options.localPath;
  this.include = options.include;
  this.enabled = options.enabled || true;
  this.callback = options.callback || function(){};
  this.uploadOnFirstBuild = options.uploadOnFirstBuild || false;
  this.handleEmit = this.handleEmit.bind(this);
}

SftpOutputPlugin.prototype.upload = function(filenames, index, callback) {

  index = index || 0;
  let that = this;
  const { localPath, remotePath } = that;
  let localFilePath = filenames[index];
  let remoteFilePath = path.join(that.remotePath, localFilePath.replace(that.localPath, ''));
  let sftpConfig = that.username + ':' + that.password + '@' + that.host + ':' + remoteFilePath;

  client.scp(localFilePath, sftpConfig, function(err) {

      if (err) {
        console.log(chalk.red('\nCould not upload file: %s'), localFilePath );
        console.log(chalk.red(err));
        callback()
      } else {

        if ( filenames[index + 1] ) {
          that.upload(filenames, index + 1, callback);
        } else {
          client.close();
          callback(); // Continue compilation
        }

      }

  });

}

SftpOutputPlugin.prototype.handleEmit = function(compilation, callback) {

  let that = this;
  let changedAssets = [];

  var changedChunks = compilation.chunks.filter(function(chunk) {
      var oldVersion = this.chunkVersions[chunk.name];
      this.chunkVersions[chunk.name] = chunk.hash;
      return chunk.hash !== oldVersion;
    }.bind(this))
    .forEach( chunk => changedAssets = changedAssets.concat(chunk.files) );

    // Create absolute paths
    let emittedAssets = Object.keys(compilation.assets);

    // Make sure the changed assets were actually emitted
    // And return their absolutepath
    changedAssets = changedAssets
    .filter( asset => emittedAssets.indexOf(asset) > -1 )
    .map( asset => path.join(that.localPath, asset) );

  if (changedAssets.length > 0) {
    this.upload(changedAssets, 0, callback)
  } else {
    callback()
  }

}

SftpOutputPlugin.prototype.apply = function (compiler) {

  // Handle compiler `emit` event
  compiler.plugin('after-emit', this.handleEmit.bind(this));

}

module.exports = SftpOutputPlugin
