/**
 * @fileinfo Watch the specified git repository for new tags.
 */

var watch = module.exports = function watch() {
  var self = this;
  var delay = self.config.get('delay') || 60000;
  var knownTags = [];
  // TODO - check for existing tags, we can't guarantee this will run forever...

  self.log.info('Starting to watch ' + self.config.get('upstream remote') + ' for new tags.');

  setInterval(
    function findNewTags() {
      self.fetch(function(err) {
        if (err) {
          self.log.error(err);
          return;
        }

        self.getTags(function(err, tags) {
          if (err) {
            self.log.error(err);
            return;
          }

          tags.forEach(function(tag) {
            // Create a branch from the new tag and add it to the known tags.
            if (knownTags.indexOf(tag) === -1) {
              self.log.info('New tag found: ' + tag + '.');
              self.tagBranch(tag);
              knownTags.push(tag);
            }
          });
        });
      });
    },
    delay
  );
};
watch.usage = 'Watch a git repository for new tags.';
