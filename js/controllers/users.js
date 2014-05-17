var users = new Controller('users', {
  index: function() {
    self = this;
    var elementData = {
      foo: 'bar'
    };
    self.renderElement('element', elementData, function(element) {
      self.data.element = element;
      console.log(self.data);
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
