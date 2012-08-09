var sys = require('sys');
var exec = require('child_process').exec;
var clean = module.exports = function clean() {
  exec("git status", this.puts);
};
clean.puts = function(error, stdout, stderr) {
  sys.puts(stdout);
};
clean.usage = "Clean the local working directory.";
