var usersController = new rise.Controller('users', {
  index: function() {
    self = this;
    Model.getToken('vitrina@freta.la', '123456', function(token) {
      usersModel.get(function(err, result) {
        self.data.users = result;
        listUserView.render(self.data);
      });
    });
  },
  create: function() {
  },
  view: function(id) {
  },
  update: function(id) {
  },
  remove: function(id) {
  },
});
