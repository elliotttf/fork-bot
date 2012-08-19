/**
 * @fileinfo Watch the specified git repository for new tags.
 */
var url = require('url');
var util = require('util');
var _ = require('underscore');
var redis = require('redis');

var watch = module.exports = function watch() {
  var self = this;
  var delay = self.config.get('delay') || 60000;
  var http = self.config.get('api endpoint').match(/^https/) ? require('https') : require('http');
  var knownTags = [];
  var client = redis.createClient(
    self.config.get('redis:port'),
    self.config.get('redis:host'),
    self.config.get('redis:options')
  );
  if (self.config.get('redis:auth')) {
    client.auth(self.config.get('redis:auth'), function(err) {
      self.log.error(err);
      process.exit(1);
    });
  }
  client.on('error', function(err) {
    if (err) {
      self.log.error(err);
      process.exit(1);
    }
  });

  /**
   * Callback for after merging a tag.
   */
  self.mergedTag = function(err, tag, pr) {
    if (err) {
      self.log.error(util.format(
        'Error merging tag for %s (%s)',
        tag.name,
        err
      ));
      return;
    }
    self.log.info(util.format('Opened pull request: %d', pr.number));
  };

  /**
   * Callback for after creating a branch.
   */
  self.createdBranch = function(err, tag, branch) {
    if (err) {
      self.log.error(util.format(
        'Error creating branch for %s (%s)',
        tag.name,
        err
      ));
      return;
    }
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
    knownTags.push(tag.name);
    client.set('knownTags', JSON.stringify(knownTags));
    self.createNewBranch(tag, self.createdBranch);
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

  /**
   * Start watching the repository for known tags.
   */
  self.watch = function() {
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

  // When redis is ready, look for any known tags.
  client.once('ready', function() {
    client.get('knownTags', function(err, reply) {
      if (err) {
        self.log.error(err);
        process.exit(1);
      }
      if (reply) {
        knownTags = JSON.parse(reply);
      }
      self.watch();
    });
  });
};

watch.usage = 'Watch a git repository for new tags.';
