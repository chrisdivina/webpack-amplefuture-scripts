const client = require('scp2')
const chalk = require('chalk')

const test = function (host, username, password, port, callback) {
  
  client.defaults({
    port,
    host,
    username,
    password
  });

  client.on('error', function(err) {
    console.log( chalk.redBright('  Could not connect to server.\n') )
    console.log( '1) Please check your config file')
    console.log( '2) If you are behind a proxy, please check that npm is set up correctly: https://jjasonclark.com/how-to-setup-node-behind-web-proxy/' )
    console.log( '3) If it is all fine, please check your internet connection')
    console.log( '\n\n' )
  });

  client.sftp( function(err) {
    client.close();
    callback(err);
  });

}

module.exports = {
  test
}
