/**
 * @fileinfo Watch the specified git repository for new tags.
 */
var url = require('url');
var util = require('util');
var _ = require('underscore');

var watch = module.exports = function watch() {
  var self = this;
  var delay = self.config.get('delay') || 60000;
  var http = self.config.get('api endpoint').match(/^https/) ? require('https') : require('http');
  var knownTags = [];
  // TODO - check for existing tags, we can't guarantee this will run forever...

  /**
   * Callback for after opening a pull request.
   */
  self.pullRequested = function(err, pr) {
    self.log.info(util.format('Opened pull request: %d', pr.number));
  };

  /**
   * Callback for after merging a tag.
   */
  self.mergedTag = function(err, tag, branch) {
    self.pullRequest(branch, self.pullRequested);
  };

  /**
   * Callback for after creating a branch.
   */
  self.createdBranch = function(err, tag, branch) {
    self.mergeTag(tag, branch, self.mergedTag);
  };

  /**
   * Handle a new tag.
   *
   * @param {object} tag
   *   An individual tag object that is not currently known.
   */
  self.newTag = function(tag) {
    /*
    1. Create new branch with prefix
    2. Merge contents of new tag into new branch
    3. Open pull request against appropriate branch with new branch
     */
    self.createNewBranch(tag.name, self.createdBranch);
  };

  /**
   * Filter the tags array if necessary, and find any new tags.
   *
   * @param {object} tags
   *   The tags array returned from the API.
   */
  self.gotTags = function(tags) {
    var pattern = self.config.get('tag pattern');
    if (pattern) {
      tags = _.filter(tags, function(tag) {
        var re = new RegExp(pattern);
        return re.exec(tag.name) !== null;
      });
    }

    _.each(tags, function(tag) {
      if (knownTags.indexOf(tag.name) === -1) {
        self.newTag(tag);
      }
    });
  };

  self.log.info(util.format(
    'Starting to watch %s/%s for new tags.',
    self.config.get('upstream:user'),
    self.config.get('upstream:repo')
  ));

  var lastModified = null;
  var etag = null;

  /**
   * Periodically check the API for new tags.
   */
  setInterval(
    function findNewTags() {
      var options = url.parse(util.format(
        '%s/repos/%s/%s/tags',
        self.config.get('api endpoint'),
        self.config.get('upstream:user'),
        self.config.get('upstream:repo')
      ));
      options.headers = {};
      if (lastModified) {
        options.headers['last-modified'] = lastModified;
      }
      if (etag) {
        options.headers.etag = etag;
      }

      http.get(options, function(res) {
        var tags = '';
        res.on('data', function(chunk) {
          tags += chunk;
        });
        res.on('end', function() {
          if (typeof res.headers['last-modified'] !== 'undefined') {
            lastModified = res.headers['last-modified'];
          }
          if (typeof res.headers.etag !== 'undefined') {
            etag = etag;
          }
          self.gotTags(JSON.parse(tags));
        });
      });
    },
    delay
  );
};
watch.usage = 'Watch a git repository for new tags.';
