var git = require('gift');
var branch = module.exports = function branch(tag) {
  var fork = this.config.get('fork');
  repo = git(this.config.get(fork.local));
};
branch.usage = 'branch <tag>';
