(function() {
  //get the argument names of a function eg function(foo, bar) ---> ['foo', 'bar']
  var getParamNames = function(func) {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
       result = [];
    return result;
  };

  var extractArgs = function(fn, data) {
    var args = [];
    _.each(getParamNames(fn), function(val) {
      args.push(data[val]);
    });
    return args;
  };

  Controller = function Controller(name, actions) {
    var self = this;
    self.name = name;
    self.actions = actions;
    Rise.riseInstance.controllers[name] = self;
    //register the route for each action
    _.each(actions, function(action, actionName) {
      var params = getParamNames(action);
      var url = '/' + self.name;
      if(actionName != 'index') {
        url += '/' + actionName;
      }
      _.each(params, function (param) {
        url += '/:' + param;
      });
      Rise.Router.register(url);
    });
  };

  //this is the function that the router calls when a controller and action are matched
  Controller.prototype.invoke = function invoke(action, data) {
    this.viewUrl = '../views/' + this.name + '/' + action + '.html';
    var args = extractArgs(this.actions[action], data);
    if(this.actions[action]) {
      //execute the action itself
      this.actions[action].apply(this, args);
    } else {
      throw new Error('Action ' + action + ' is not defined in controller ' + this.name);
    }
  };

  Rise.prototype.Controller = Controller;

})();
