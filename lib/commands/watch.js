/**
 * @fileinfo Watch the specified git repository for new tags.
 */

var util = require('util');
var git = require('gift');

var watch = module.exports = function watch() {
  var self = this;
  var delay = self.config.get('delay') || 60000;
  util.log('Starting to watch ' + self.config.get('upstream remote') + ' for new tags.');

  setInterval(
    function findNewTags() {
      var repo = git(self.config.get('path'));
      repo.remote_fetch(self.config.get('upstream remote'), function(err) {
        if (err) {
          repo = null;
          util.log('ERROR: ' + err);
          return;
        }

        repo.tags(function(err, tags) {
          if (err) {
            util.log('ERROR: ' + err);
            return;
          }

          console.log(tags);
        });

        repo = null;
      });
    },
    delay
  );
};
watch.usage = 'Watch a git repository for new tags.';
