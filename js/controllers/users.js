var usersController = new rise.Controller('users', {
  index: function() {
    self = this;
    Model.getToken('vitrina@freta.la', '123456', function(token) {
      usersModel.get(function(err, result) {
        self.data.users = result;
        self.done();
      });
    });
  },
  create: function() {
    this.done();
  },
  view: function(id) {
    this.done();
  },
  update: function(id) {
    this.done();
  },
  remove: function(id) {
    this.done();
  },
});
