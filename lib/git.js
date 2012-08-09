var sys = require('sys')
var exec = require('child_process').exec;
var os = require('os');

var Git = module.exports;

Git.attach = function() {
  this.branch = function(track, branch, callback) {
    var command = this.commandPrefix + 'git branch ' + branch + ' --track ' + track;

    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };

  this.fetch = function(callback) {
    var command = this.commandPrefix + 'git fetch --all';

    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };

  this.getTags = function(callback) {
    var tags = [];

    var command = this.commandPrefix + 'git tag';

    exec(command, function(error, stdout, stderr) {
      var tags = stdout.split(os.EOL);
      tags = tags.filter(function(tag) { return tag.length > 0; });
      callback(error, tags);
    });
  };

  this.merge = function(refSpec, callback) {
    var command = this.commandPrefix + 'git merge --no-ff ' + refSpec;

    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };

  this.push = function(remote, branch, callback) {
    var command = this.commandPrefix + 'git push ' + remote + ' ' + branch;

    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };

  this.checkout = function(branch, callback) {
    var command = this.commandPrefix + 'git checkout ' + branch;
    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };
};

Git.init = function(done) {
  this.commandPrefix = 'cd ' + this.config.get('path') + ' && ';
  return done();
};
