var getParamNames = function(func) {
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var ARGUMENT_NAMES = /([^\s,]+)/g;
  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if(result === null)
     result = [];
  return result;
};
var controllers = {};
var Controller = function Controller(name, actions) {
  var self = this;
  self.name = name;
  self.actions = actions;
  controllers[name] = self;
  _.each(actions, function(action, actionName) {
    var params = getParamNames(action);
    var url = '/' + self.name;
    if(actionName != 'index') {
      url += '/' + actionName;
    }
    _.each(params, function (param) {
      url += '/:' + param;
    });
    Router.register(url);
  });
};

Controller.prototype.before = function before() {};
Controller.prototype.after = function after() {};

Controller.prototype.invoke = function invoke(action, data) {
  this.viewUrl = '../views/' + this.name + '/' + action + '.html';
  this.data = data;
  this.before();
  if(this.actions[action]) {
    this.actions[action].call(this);
  } else {
    throw new Error('Action ' + action + ' is not defined in controller ' + this.name);
  }
};

Controller.prototype.done = function done() {
  this.after();
  this.render();
};

Controller.prototype.render = function render($element) {
  $element = $element || $('body');
  self = this;
  $.get(self.viewUrl, function(response) {
    var template = Handlebars.compile(response);
    $element.html(template(self.data));
  })
  .fail(function(response) {
    if(response.status == 404) {
      console.log(response);
      throw new Error('View file ' + self.viewUrl + ' wasn\'t found');
    } else {
      throw new Error('Error ' + response.status + ' while trying to load view');
    }
  });
};

Controller.prototype.renderElement = function renderElement(path, data, cb) {
  self = this;
  path = '../views/elements/' + path + '.html';
  $.get(path, function(response) {
    var template = Handlebars.compile(response);
    cb.call(this, template(data));
  })
  .fail(function(response) {
    if(response.status == 404) {
      console.log(response);
      throw new Error('Element file ' + path + ' wasn\'t found');
    } else {
      throw new Error('Error ' + response.status + ' while trying to load view');
    }
  });
};
