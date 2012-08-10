/**
 * @fileinfo Bot logic, ermahgerd callbackz!
 */

var Bot = module.exports;

Bot.attach = function() {
  var self = this;

  var pushCallback = function(err) {
    if (err) {
      self.emit('unlock-' + self.tag);
      self.log.error(err);
      // TODO - remove the tag from the known tags array so we update it next time.
      return;
    }

    self.emit('unlock-' + self.tag);
    self.log.info('Pushed new branch to ' + self.config.get('origin remote') + '/' + self.branchName);
  };

  var mergeCallback = function(err) {
    // TODO - handle merge conflicts?
    if (err) {
      self.emit('unlock-' + self.tag);
      self.log.error(err);
      // TODO - remove the tag from the known tags array so we update it next time.
      return;
    }

    self.log.info('Merged tags/' + self.tag + ' into ' + self.branchName);
    self.pushBranch(self.config.get('origin remote'), self.branchName, pushCallback);
  };

  var cleanCallback = function(err) {
    if (err) {
      self.emit('unlock-' + self.tag);
      self.log.error(err);
      // TODO - remove the tag from the known tags array so we update it next time.
      return;
    }

    self.log.info('Checked out ' + self.branchName);
    self.merge('tags/' + self.tag, mergeCallback);
  };

  var resetCallback = function(err) {
    if (err) {
      self.emit('unlock-' + self.tag);
      self.log.error(err);
      // TODO - remove the tag from the known tags array so we update it next time.
      return;
    }
    self.clean(cleanCallback);
  };

  var checkoutCallback = function(err) {
    if (err) {
      self.emit('unlock-' + self.tag);
      self.log.error(err);
      // TODO - remove the tag from the known tags array so we update it next time.
      return;
    }
    self.reset(resetCallback);
  };

  var branchCallback = function(err) {
    if (err) {
      self.emit('unlock-' + self.tag);
      self.log.error(err);
      // TODO - remove the tag from the known tags array so we update it next time.
      return;
    }
    self.log.info('Created branch: ' + self.branchName);

    self.checkout(self.branchName, checkoutCallback);
  };

  this.tagBranch = function(tag) {
    self.semaphores = self.semaphores || {};
    self.semaphores[tag] = setInterval(
      function(tag) {
        if (self.locked) {
          return;
        }
        self.locked = true;

        self.tag = tag;
        self.prefix = self.config.get('branch prefix') || '';
        self.track = self.config.get('origin remote') + '/' + self.config.get('origin branch');
        self.branchName = self.prefix + self.tag;
        self.branch(self.track, self.branchName, branchCallback);
      },
      10,
      tag
    );

    self.once('unlock-' + tag, function unlock() {
      clearInterval(self.semaphores[self.tag]);
      self.semaphores[self.tag] = null;
      self.locked = false;
      self.tag = null;
      self.prefix = null;
      self.track = null;
      self.branchName = null;
    });
  };

  // REALLY simple semaphore.
  this.locked = false;
};

Bot.init = function(done) {
  return done();
};
