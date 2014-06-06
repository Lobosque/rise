rise.Model.setAuth('sms@freta.la', '123456');
var usersController = new rise.Controller('users', {
  index: function() {
    self = this;
    usersModel.get(function(err, result) {
      self.data.users = result;
      listUserView.render(self.data);
    });
  },
  create: function() {
  },
  view: function(id, other) {
    console.log(id);
    console.log(other);
  },
  update: function(id) {
  },
  remove: function(id) {
  },
});
