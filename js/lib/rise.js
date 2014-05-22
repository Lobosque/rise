(function() {
  if(!window.jQuery) {
    throw new Error('jQuery is not defined');
  }

  if(!window.Handlebars) {
    throw new Error('Handlebars is not defined');
  }

  if(!window._) {
    throw new Error('Lodash is not defined');
  }
  var controllers = {}; //we store all controllers here
  var riseInstance;

  window.Rise = function(settings) {
    this.settings = settings;
    // Listen on hash change:
    window.addEventListener('hashchange', Rise.Router.listener);
    // Listen on page load:
    window.addEventListener('load', Rise.Router.listener);
    riseInstance = this;
  };
  console.log(Rise);

  Rise.helpers = {
    UrlToArray: function(url) {
      var request = {};
      var pairs = url.substring(url.indexOf('?') + 1).split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return request;
    },
    //find and replace all occurrences in a string
    replaceAll: function(find, replace, str) {
      return str.replace(new RegExp(find, 'g'), replace);
    },
    //returns an array with all arguments from a url eg /users/:foo/:bar gives ['foo', 'bar']
    parseRestUrl: function(url) {
      var found = [];
      var regexp = /\:([^\/]+)(\/|$)/g;
      var currentMatch;

      while(currentMatch = regexp.exec(url)) {
        found.push(currentMatch[1]);
      }
      return found;
    },
    //this function extracts the arguments from the url based in the template
    //that was matched to it
    getUrlData: function(router, url) {
      var data = {
        router: {},
        controller: {}
      };
      var path = router.path;
      if(url.charAt(0) == '/') {
        url = url.substr(1);
      }
      if(path.charAt(0) == '/') {
        path = path.substr(1);
      }
      var tokensUrl = url.split('/');
      var tokensPath = path.split('/');
      var i = 2; //this is where the args start
      data.router.controller = tokensPath[0];
      //in cases like /users/:id, args start at 1 and action is 'index'
      if(tokensPath[1] === undefined || tokensPath[1].charAt(0) == ':') {
        i--;
        data.router.action = 'index';
      } else {
        data.router.action = tokensPath[1];
      }
      for(i; i < tokensUrl.length; i++) {
        var argName = tokensPath[i].substr(1);
        data.controller[argName] = tokensUrl[i];
      }
      return data;
    },
    trimSlashes: function(str) {
      return str.replace(/^\/+|\/+$/gm,'');
    },
    getParamNames: function(func) {
      var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
      var ARGUMENT_NAMES = /([^\s,]+)/g;
      var fnStr = func.toString().replace(STRIP_COMMENTS, '');
      var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
      if(result === null)
         result = [];
      return result;
    },
  };

  Rise.Router = {
    routes: [],
    //TODO: use controller and action args to override default route interpretation
    register: function register(path, controller, action) {
      path = Rise.helpers.trimSlashes(path);
      Rise.Router.routes.push({
        path: path,
        regexp: Rise.Router.routeToRegExp(path),
        controller: controller,
        action: action
      });
    },
    callController: function(router, url, params) {
      var data = Rise.helpers.getUrlData(router, url);
      _.extend(data.controller, params);
      if(controllers[data.router.controller]) {
        controllers[data.router.controller].invoke(data.router.action, data.controller);
      } else {
        throw new Error('Controller ' + data.router.controller + ' is not defined');
      }
    },
    // The function called when a route change event is detected
    listener: function(event) {
      var input = location.hash.slice(1);
      var url, params;
      //check if we have params (?foo=bar) and extract them;
      if(input.indexOf('?') === -1) {
        url = Rise.helpers.trimSlashes(input) || '/';//TODO: must be able to set a default controller and action for '/'
      } else {
        url = Rise.helpers.trimSlashes(input.split('?')[0]) || '/';//TODO: must be able to set a default controller and action for '/'
        params = Rise.helpers.UrlToArray(input.split('?')[1]);
      }
      //find the handler for this url
      _.any(Rise.Router.routes, function(route) {
       if(route.regexp.test(url)) {
         Rise.Router.callController(route, url, params);
         return true;
       }
      //TODO: call 404 controller
      console.log('404: route doesn\'t exist');
      });
    },
    // this function transform our route template into a regexp, so we can match it with the user inputed url
    routeToRegExp: function(route) {
      var optionalParam = /\((.*?)\)/g;
      var namedParam    = /(\(\?)?:\w+/g;
      var splatParam    = /\*\w+/g;
      var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    }
  };

  Model = function Model(name) {
    this.name = name;
    this.baseUrl = riseInstance.settings.baseUrl;
  };

  //get a token from our api
  Model.getToken = function getToken(email, password, cb) {
    console.log(riseInstance.settings);
    cb = cb || function(){};
    $.ajax({
      type: 'POST',
      url: riseInstance.settings.baseUrl+'/token',
      data: {
        grant_type: 'password',
        username: email,
        password: password,
      },
      headers: {
        Authorization: riseInstance.settings.clientAuth
      }
    //TODO: replace with complete
    }).done(function(response) {
      riseInstance.settings.accessToken = response.access_token;
      cb.call(this, undefined, response.access_token);
    }).fail(function(response) {
      cb.call(this, new Error(response.responseJSON.error_description));
    });
  };

  //get the url to do the api call
  Model.prototype.getUrl = function getUrl(endpoint) {
    var url = '';
    //if a custom endpoint was set, use it instead the convention
    if(endpoint) {
      url += endpoint;
    } else {
        url += '/' + this.name;
        if(this.type == 'PUT' || this.type == 'DELETE') {
          url += '/:id';
        } else if(this.type == 'GET' && this.data.id) {
          url += '/:id';
        }
    }
    return this.replaceRestUrl(url);
  };

  //all request methods use sync to do the request itself
  Model.prototype.sync = function sync(cb) {
    cb = cb || function(){};
    var requestData = {
      url: this.url,
      type: this.type,
      data: this.data,
      contentType: 'application/json',
    };
    if(riseInstance.settings.accessToken) {
      requestData.headers = {
        Authorization: 'Bearer ' + riseInstance.settings.accessToken
      }
    }

    var request = $.ajax(requestData);

    request.complete(function(jqXHR, status) {
      var error = undefined;
      var result = undefined;
      if(status === 'success') {
        result = jqXHR.responseJSON;
      } else if(status === 'timeout') {
        error = new Error(this.type + ' request at ' + this.url + ' timed out');
      } else if (status === 'error') {
        error = new Error(jqXHR.responseJSON.message);
      }
      cb.call(this, error, result);
    });
  };

  Model.prototype.post = function post(data, endpoint, cb) {
    this.type = 'POST';
    this.data = data;
    this.url = this.getUrl(endpoint);
    this.sync(cb);
  };

  Model.prototype.get = function get(id, otherArgs, endpoint, cb) {
    this.type = 'GET';
    //otherArgs is optional, so we do some black magic here to rearrange args
    if(_.isFunction(id)) {
      cb = id;
      id = undefined;
      otherArgs = {};
    } else if(_.isFunction(otherArgs)) {
      cb = otherArgs;
      otherArgs = {};
    } else if(_.isString(otherArgs)) {
      cb = endpoint;
      endpoint = otherArgs;
      otherArgs = {};
    } else {
      if(_.isFunction(endpoint)) {
        cb = endpoint;
        endpoint = undefined;
      }
    }

    this.data = _.extend({id: id}, otherArgs);
    this.url = this.getUrl(endpoint);
    this.sync(cb);
  };

  Model.prototype.put = function put(data, endpoint, cb) {
    this.type = 'PUT';
    this.data = data;
    this.url = this.getUrl(endpoint);
    this.sync(cb);
  };

  Model.prototype.del = function del(id, otherArgs, endpoint, cb) {
    this.type = 'DELETE';
    //otherArgs and endpoint are optional, so we do some black magic here to rearrange args
    if(_.isFunction(otherArgs)) {
      cb = otherArgs;
      otherArgs = {};
    } else if(_.isString(otherArgs)) {
      cb = endpoint;
      endpoint = otherArgs;
      otherArgs = {};
    } else {
      if(_.isFunction(endpoint)) {
        cb = endpoint;
        endpoint = undefined;
      }
    }

    this.data = _.extend({id: id}, otherArgs);
    this.url = this.getUrl(endpoint);
    this.sync(cb);
  };

  //replace a url template with the args eg /users/:foo/:bar ---> /users/fooValue/barValue
  Model.prototype.replaceRestUrl = function replaceRestUrl(url) {
    var args = Rise.helpers.parseRestUrl(url);
    var self = this;
    _.each(args, function(v) {
      if(!self.data[v]) {
        throw new Error('Argument ' + v + ' is present on url but wasn\'t passed in');
      } else {
        url = Rise.helpers.replaceAll(':'+v, self.data[v], url);
        //as we replace, remove from data:
        delete self.data[v];
      }
    });
    return this.baseUrl + url;
  };

  Controller = function Controller(name, actions) {
    var self = this;
    self.name = name;
    self.actions = actions;
    controllers[name] = self;
    //register the route for each action
    _.each(actions, function(action, actionName) {
      var params = Rise.helpers.getParamNames(action);
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

  //before and after can be overriden to run a routine before and/or after every action
  Controller.prototype.before = function before() {};
  Controller.prototype.after = function after() {};

  //this is the function that the router calls when a controller and action are matched
  Controller.prototype.invoke = function invoke(action, data) {
    this.viewUrl = '../views/' + this.name + '/' + action + '.html';
    this.data = data;
    this.before();
    if(this.actions[action]) {
      //execute the action itself
      this.actions[action].call(this);
    } else {
      throw new Error('Action ' + action + ' is not defined in controller ' + this.name);
    }
  };

  //should be called by every action to render it
  Controller.prototype.done = function done() {
    this.after();
    this.render();
  };

  //does the rendering using handlebars
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

  //renders a separate element
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

  Rise.prototype.Model = Model;
  Rise.prototype.Controller = Controller;

})();
