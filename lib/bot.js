/**
 * @fileinfo Bot logic, ermahgerd callbackz!
 */
var url = require('url');
var util = require('util');

var Bot = module.exports;

Bot.attach = function() {
  var self = this;

  /**
   * Create a new branch on GitHub.
   *
   * @param {object} tag
   *   The tag to create the branch from.
   * @param {function} callback
   *   The function to execute on completion or error.
   */
  self.createNewBranch = function(tag, callback) {
    var options = url.parse(util.format(
      '%s/repos/%s/%s/git/refs/heads/%s',
      self.config.get('api endpoint'),
      self.config.get('origin:user'),
      self.config.get('origin:repo'),
      self.config.get('origin:branch')
    ));
    options.method = 'GET';
    options.auth = self.auth;
    self.http.request(options, function(res) {
      if (res.statusCode !== 200) {
        callback(res.statusCode, tag, null);
        return;
      }

      var master = '';
      res.on('data', function(chunk) {
        master += chunk;
      });
      res.on('end', function() {
        master = JSON.parse(master);
        var options = url.parse(util.format(
          '%s/repos/%s/%s/git/refs',
          self.config.get('api endpoint'),
          self.config.get('origin:user'),
          self.config.get('origin:repo')
        ));
        options.method = 'POST';
        options.auth = self.auth;
        var req = self.http.request(options, function(res) {
          var data = '';
          if (res.statusCode !== 201) {
            callback(res.statusCode, tag, null);
            return;
          }
          res.on('data', function(chunk) {
            data += chunk;
          });
          res.on('end', function() {
            callback(null, tag, JSON.parse(data));
          });
        });
        req.write(JSON.stringify({
          ref: util.format(
            'refs/heads/%s%s',
            self.config.get('branch prefix'),
            tag.name
          ),
          sha: master.object.sha
        }));
        req.end();
      });
    }).end();
  };

  /**
   * Merge the upstream tag into the new branch (via pull request).
   * Error out if it cannot be merged cleanly.
   *
   * @param {object} tag
   *   The upstream tag to merge.
   * @param {object} branch
   *   The branch to merge to
   * @param {function} callback
   *   The callback to execute on completion.
   */
  self.mergeTag = function(tag, branch, callback) {
    var options = url.parse(util.format(
      '%s/repos/%s/%s/pulls',
      self.config.get('api endpoint'),
      self.config.get('origin:user'),
      self.config.get('origin:repo')
    ));
    options.method = 'POST';
    options.auth = self.auth;
    var req = self.http.request(options, function(res) {
      if (res.statusCode !== 201) {
        callback(res.statusCode, tag, branch);
        return;
      }

      var pr = '';

      res.on('data', function(chunk) {
        pr += chunk;
      });

      res.on('end', function() {
        pr = JSON.parse(pr);
        // Try to merge the PR.
        var mergeOptions = url.parse(util.format(
          '%s/repos/%s/%s/pulls/%s/merge',
          self.config.get('api endpoint'),
          self.config.get('origin:user'),
          self.config.get('origin:repo'),
          pr.number
        ));
        options.method = 'PUT';
        options.auth = self.auth;
        var mergeReq = self.http.request(mergeOptions, function(mergeRes) {
          // Failed to merge.
          if (mergeRes.statusCode !== 200) {
            callback(mergeRes.statusCode, tag, branch);
            return;
          }

          callback(null, tag, branch);
        });
        mergeReq.end();
      });
    });
    req.write(JSON.stringify({
      title: util.format(
        'Automated PR for %s%s',
        self.config.get('branch prefix'),
        tag.name
      ),
      base: branch.ref,
      head: util.format(
        '%s:refs/tags/%s',
        self.config.get('upstream:user'),
        tag.name
      )
    }));
    req.end();
  };

  self.pullRequest = function(branch, callback) {
    var options = url.parse(util.format(
      '%s/repos/%s/%s/pulls',
      self.config.get('api endpoint'),
      self.config.get('origin:user'),
      self.config.get('origin:repo')
    ));
    options.method = 'POST';
    options.auth = self.auth;
    var req = self.http.request(options, function(res) {
      if (res.statusCode !== 201) {
        callback(res.statusCode, null);
        return;
      }

      var pr = '';

      res.on('data', function(chunk) {
        pr += chunk;
      });

      res.on('end', function() {
        callback(null, JSON.parse(pr));
      });
    });
    req.write(JSON.stringify({
      title: util.format(
        'Request to merge %s',
        branch.ref
      ),
      base: self.config.get('origin:branch'),
      head: branch.ref
    }));
    req.end();
  };

};

Bot.init = function(done) {
  this.http = this.config.get('api endpoint').match(/^https/) ? require('https') : require('http');
  this.auth = util.format(
    '%s:%s',
    this.config.get('github:user'),
    this.config.get('github:pass')
  );
  return done();
};
