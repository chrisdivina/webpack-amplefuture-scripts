const scp2 = require('scp2');
const path = require('path');
const chalk = require('chalk');

function SftpOutputPlugin(options) {
  this.startTime = Date.now();
  this.prevTimestamps = {};
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
  let remoteFilePath = path.join(that.remotePath, filename.replace(that.localPath, ''));

  scp2.upload(localFilePath, remoteFilePath, function(err) {

      if (err) {
        console.log(chalk.red('\nCould not upload file: %s'), localFilePath );
        console.log(chalk.red(err));
        callback()
      } else {

        if ( filenames[index + 1] ) {
          that.upload(filenames, index + 1, callback);
        } else {
          scp2.close();
          callback(); // Continue compilation
        }

      }

  });

}

SftpOutputPlugin.prototype.handleEmit = function(compilation, callback) {

    if (this.uploadOnFirstBuild) {
        var changedFiles = Object.keys(compilation.assets).map( asset => path.join(this.localPath, asset) );
        this.upload(changedFiles, 0, callback)
    }

    var changedFiles = Object.keys(compilation.fileTimestamps).filter(function(watchfile) {
      return (this.prevTimestamps[watchfile] || this.startTime) < (compilation.fileTimestamps[watchfile] || Infinity);
    }.bind(this));

    this.prevTimestamps = compilation.fileTimestamps;

    if (changedFiles.length > 0) {
      this.upload(changedFiles, 0, callback)
    } else {
      callback()
    }
}

SftpOutputPlugin.prototype.apply = function (compiler) {

  let that = this;

  // Initialise sftp config
  const { host, username, password, port } = that;
  const options = {host, username, password, port};
  scp2.defaults(options);

  // Handle compiler `emit` event
  compiler.plugin('emit', that.handleEmit);

}

module.exports = SftpOutputPlugin
