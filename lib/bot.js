var Bot = module.exports;

Bot.attach = function() {
  this.tagBranch = function(tag) {
    var self = this;

    var prefix = self.config.get('branch prefix') || '';
    var track = self.config.get('origin remote') + '/' + self.config.get('origin branch');
    var branch = prefix + tag;
    self.branch(track, branch, function(err) {
      if (err) {
        self.log.error(err);
        // TODO - remove the tag from the known tags array so we update it next time.
        return;
      }

      self.log.info('Created branch: ' + branch);

      // If the git repo is "locked" try agian in 10ms.
      var semaphore = setInterval(function() {
        if (self.locked) {
          return;
        }
        self.locked = true;
        self.checkout(branch, function(err) {
          if (err) {
            self.locked = false;
            clearInterval(semaphore);
            semaphore = null;
            self.log.error(err);
            // TODO - remove the tag from the known tags array so we update it next time.
            return;
          }

          self.log.info('Checked out ' + branch);
          self.merge('tags/' + tag, function(err) {
            if (err) {
              self.locked = false;
              clearInterval(semaphore);
              semaphore = null;
              self.log.error(err);
              // TODO - remove the tag from the known tags array so we update it next time.
              return;
            }

            self.log.info('Merged tags/' + tag + ' into ' + branch);
            self.push(self.config.get('origin remote'), branch, function(err) {
              if (err) {
                self.locked = false;
                clearInterval(semaphore);
                semaphore = null;
                self.log.error(err);
                // TODO - remove the tag from the known tags array so we update it next time.
                return;
              }

              self.locked = false;
              clearInterval(semaphore);
              semaphore = null;
              self.log.info('Pushed new branch to ' + self.config.get('origin remote') + '/' + branch);
            });
          });
        });
      },
      10);
    });
  };

  // REALLY simple semaphore.
  this.locked = false;
};

Bot.init = function(done) {
  return done();
};
