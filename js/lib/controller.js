var controllers = {};
var Controller = function Controller(name) {
  this.name = name;
  controllers[name] = this;
};

Controller.prototype.before = function before() {
};

Controller.prototype.invoke = function invoke(action, data) {
  this.data = data;
  this.before();
  if(this[action]) {
    var ret = this[action].call(this);
  } else {
    throw new Error('Action ' + action + ' is not defined in controller ' + this.name);
  }
  if (!ret) {
    this.after();
  }
};
  
Controller.prototype.after = function after() {
  //TODO: render view
};

