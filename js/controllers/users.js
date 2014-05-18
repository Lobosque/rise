var usersController = new Controller('users', {
  index: function() {
    self = this;
    Model.getToken('vitrina@freta.la', '123456', function(token) {
      this.data.users = usersModel.get();
      self.done();
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
