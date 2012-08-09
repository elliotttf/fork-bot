var Bot = module.exports;

Bot.attach = function() {
  this.tagBranch = function(tag) {
    var self = this;
    self.log.info('Creating new branch for tag: ' + tag);

    var prefix = self.config.get('branch prefix') || '';
    self.branch(prefix + tag, function(err) {
    });
  };
};

Bot.init = function(done) {
  return done();
};
