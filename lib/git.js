var sys = require('sys')
var exec = require('child_process').exec;
var os = require('os');

var Git = module.exports;

Git.attach = function() {
  this.branch = function(branch, callback) {
    var err = 0;

    var command = this.commandPrefix + 'git branch ' + branch;

    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };

  this.fetch = function(callback) {
    var err = 0;
    var command = this.commandPrefix + 'git fetch';

    exec(command, function(error, stdout, stderr) {
      callback(error);
    });
  };

  this.getTags = function(callback) {
    var err = 0;
    var tags = [];

    var command = this.commandPrefix + 'git tag';

    exec(command, function(error, stdout, stderr) {
      var tags = stdout.split(os.EOL);
      tags = tags.filter(function(tag) { return tag.length > 0; });
      callback(err, tags);
    });
  };

  this.merge = function(callback) {
    var err = 0;

    callback(err);
  };

  this.push = function(callback) {
    var err = 0;
    callback(err);
  };

  this.commit = function(callback) {
    var err = 0;
    callback(err);
  };
};

Git.init = function(done) {
  this.commandPrefix = 'cd ' + this.config.get('path') + ' && ';
  return done();
};
