rise.Model.setAuth('sms@freta.la', '123456');
var usersController = new rise.Controller('users', {
  index: function() {
    self = this;
    var args = {
      pageSize: self.data.pageSize || '2',
      page: self.data.page || '1',
    };
    usersModel.get(args, function(err, result, headers) {
      self.data.users = result;
      self.data.pagination = headers.link;
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
