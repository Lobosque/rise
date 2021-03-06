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

  window.Rise = function(settings) {
    this.settings = settings || {};
    // Listen on hash change:
    window.addEventListener('hashchange', Rise.Router.listener);
    // Listen on page load:
    window.addEventListener('load', Rise.Router.listener);
    Rise.riseInstance = this;
    this.controllers = {};
    this.Router = Rise.Router;
    this.Helpers = Rise.Helpers;
  };

})();

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
    this.data = data;
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

// Rise.Events
// Based on Backbone.Events

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
(function() {
  
  var Events = {

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events || (this._events = {});
    var events = this._events[name] || (this._events[name] = []);
    events.push({callback: callback, context: context, ctx: context || this});
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _.once(function() {
      self.off(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function(name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
    if (!name && !callback && !context) {
      this._events = void 0;
      return this;
    }
    names = name ? [name] : _.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      if (events = this._events[name]) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) delete this._events[name];
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(name) {
    if (!this._events) return this;
    var args = slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, arguments);
    return this;
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function(obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;
    var remove = !name && !callback;
    if (!callback && typeof name === 'object') callback = this;
    if (obj) (listeningTo = {})[obj._listenId] = obj;
    for (var id in listeningTo) {
      obj = listeningTo[id];
      obj.off(name, callback, this);
      if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
    }
    return this;
  }

};

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;
  
  Rise.Events = Events;
})();
(function() {
  Rise.Helpers = {
    Auth: {
      setAuth: function(l, p) {
        Rise.riseInstance.settings.login = l;
        Rise.riseInstance.settings.password = p;
      },
      checkLocalStorageAuth: function() {
        var email = localStorage.getItem('email');
        var password = localStorage.getItem('password');
        if(email && password) {
          Rise.Helpers.Auth.setAuth(email, password);
        }
      },
      removeLocalStorageAuth: function() {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
      },
      hasAuth: function hasAuth() {
        return !!Rise.riseInstance.settings.login && !!Rise.riseInstance.settings.password;
      },
      login: function(email, password, remember, cb) {
        if(remember) {
          localStorage.setItem('email', email);
          localStorage.setItem('password', password);
        }
        Rise.Helpers.Auth.setAuth(email, password);
        Rise.riseInstance.Model.getToken(function(err, response) {
          if(err) {
            cb.call(this, err);
          } else {
            cb.call(this);
          }
        });
      },
      logout: function(url) {
        Rise.riseInstance.Helpers.Auth.removeLocalStorageAuth();
        Rise.riseInstance.Helpers.Auth.setAuth(undefined, undefined);
        Rise.Router.go(url);
      }
    }
  };
})();

(function() {
  // helper function to find and replace all occurrences
  var replaceAll = function(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
  };

  var parseLinkHeader = function(header) {
    if (header.length == 0) {
      return {};
    }
    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    _.each(parts, function(p) {
      var section = p.split(';');
      if (section.length != 2) {
        throw new Error("section could not be split on ';'");
      }
      var url = section[0].replace(/<(.*)>/, '$1').trim();
      var name = section[1].replace(/rel="(.*)"/, '$1').trim();
      links[name] = url;
    });
    return links;
  };

  var parseResponseHeaders = function(headerStr) {
    var headers = {};
    if (!headerStr) {
      return headers;
    }
    var headerPairs = headerStr.split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
      var headerPair = headerPairs[i];
      // Can't use split() here because it does the wrong thing
      // if the header value has the string ": " in it.
      var index = headerPair.indexOf('\u003a\u0020');
      if (index > 0) {
        var key = headerPair.substring(0, index);
        var val = headerPair.substring(index + 2);
        headers[key.toLowerCase()] = val;
      }
    }
    return headers;
  };

  //helper function that returns an array with all arguments from a url eg /users/:foo/:bar gives ['foo', 'bar']
  var parseRestUrl = function(url) {
    var found = [];
    var regexp = /\:([^\/]+)(\/|$)/g;
    var currentMatch;

    while(currentMatch = regexp.exec(url)) {
      found.push(currentMatch[1]);
    }
    return found;
  };

  Model = function Model(name) {
    this.name = name;
    this.baseUrl = Rise.riseInstance.settings.baseUrl;
  };

  //get a token from our api
  Model.getToken = function getToken(cb) {
    cb = cb || function(){};
    $.ajax({
      type: 'POST',
      url: Rise.riseInstance.settings.baseUrl+'/authenticate',
      data: {
        grant_type: 'password',
        username: Rise.riseInstance.settings.login,
        password: Rise.riseInstance.settings.password,
      },
      headers: {
        Authorization: Rise.riseInstance.settings.clientAuth
      }
    //TODO: replace with complete
    }).done(function(response) {
      Rise.riseInstance.settings.accessToken = response.access_token;
      cb.call(this, undefined, response.access_token);
    }).fail(function(response) {
      var err = new Error(response.responseJSON.error_description);
      err.status = response.status;
      cb.call(this, err);

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
    self = this;
    Model.getToken(function(err, token) {
      cb = cb || function(){};
      var requestData = {
        url: self.url,
        type: self.type,
        contentType: 'application/json',
      };
      if(self.type == 'POST' || self.type == 'PUT') {
        requestData.data = JSON.stringify(self.data);
      } else {
        requestData.data = self.data;
      }
      if(Rise.riseInstance.settings.accessToken) {
        requestData.headers = {
          Authorization: 'Bearer ' + Rise.riseInstance.settings.accessToken
        }
      }

      var request = $.ajax(requestData);

      request.complete(function(jqXHR, status) {
        var error = undefined;
        var result = undefined;
        var headers = undefined;
        if(status === 'success') {
          result = jqXHR.responseJSON;
          var responseHeaders = parseResponseHeaders(jqXHR.getAllResponseHeaders());
          if(responseHeaders.link) {
            headers = {
              link: parseLinkHeader(responseHeaders.link)
            };
          }
        } else if(status === 'timeout') {
          error = new Error(self.type + ' request at ' + self.url + ' timed out');
        } else if (status === 'error') {
          error = new Error(jqXHR.responseJSON.message);
          error.status = jqXHR.status;
          error.code = jqXHR.responseJSON.code;
        }
       
        cb.call(self, error, result, headers);
      });
    });
  };

  Model.prototype.post = function post(data, endpoint, cb) {
    this.type = 'POST';
    if(_.isFunction(data)) {
      cb = data;
      data = undefined;
      endpoint = undefined;
    } else if(_.isFunction(endpoint)) {
      cb = endpoint;
      endpoint = undefined;
    }
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
    } else if(_.isObject(id)) {
      if(_.isString(otherArgs)) {
        cb = endpoint;
        endpoint = otherArgs;
        otherArgs = id;
        id = undefined;
      } else {
        cb = otherArgs;
        otherArgs = id;
        id = undefined;
      }
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

  Model.prototype.put = function put(id, data, endpoint, cb) {
    this.type = 'PUT';
    if(_.isFunction(data)) {
      cb = data;
      data = undefined;
      endpoint = undefined;
    } else if(_.isFunction(endpoint)) {
      cb = endpoint;
      endpoint = undefined;
    }
    this.data = _.extend({id: id}, data);
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
    var args = parseRestUrl(url);
    var self = this;
    _.each(args, function(v) {
      if(!self.data[v]) {
        throw new Error('Argument ' + v + ' is present on url but wasn\'t passed in');
      } else {
        url = replaceAll(':'+v, self.data[v], url);
        //as we replace, remove from data:
        delete self.data[v];
      }
    });
    return this.baseUrl + url;
  };

  Rise.prototype.Model = Model;

})();


(function() {
  /* this function extracts the arguments from the url based in the template
   * that was matched to it
  **/
  var getUrlData = function(router, url) {
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
  };

  var trimSlashes = function(str) {
    return str.replace(/^\/+|\/+$/gm,'');
  }

  var urlToArray = function(url) {
    var request = {};
    var pairs = url.substring(url.indexOf('?') + 1).split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return request;
  };

  var overrides = {};

  Rise.Router = {
    routes: [],
    go: function(url) {
      window.removeEventListener('hashchange', Rise.Router.listener, false);
      if(url.charAt(0) == '/') {
        window.location = '#' + url;
      } else {
        window.location = '#/' + url;
      }
      Rise.Router.listener(undefined, url);
      window.addEventListener('hashchange', Rise.Router.listener);
    },
    override: function(routes) {
      _.each(routes, function(val, key) {
        var trimmedKey = trimSlashes(key);
        if(trimmedKey === '') {
          trimmedKey = '/';
        }
        var trimmedVal = trimSlashes(val);
        if(trimmedKey != key) {
          delete routes[key];
        }
        routes[trimmedKey] = trimmedVal;
      });
      overrides = routes;
    },
    //TODO: use controller and action args to override default route interpretation
    register: function register(path, controller, action) {
      path = trimSlashes(path);
      Rise.Router.routes.push({
        path: path,
        regexp: Rise.Router.routeToRegExp(path),
        controller: controller,
        action: action
      });
    },
    callController: function(router, url, params) {
      var data = getUrlData(router, url);
      _.extend(data.controller, params);
      if(Rise.riseInstance.controllers[data.router.controller]) {
        Rise.riseInstance.controllers[data.router.controller].invoke(data.router.action, data.controller);
      } else {
        throw new Error('Controller ' + data.router.controller + ' is not defined');
      }
    },
    // The function called when a route change event is detected
    listener: function(event, url) {
      var input = url || location.hash.slice(1);
      var url, params;
      //check if we have params (?foo=bar) and extract them;
      if(input.indexOf('?') === -1) {
        url = trimSlashes(input) || '/';
      } else {
        url = trimSlashes(input.split('?')[0]) || '/';
        params = urlToArray(input.split('?')[1]);
      }
      url = overrides[url] || url;
      //find the handler for this url
      var exists = _.any(Rise.Router.routes, function(route) {
       if(route.regexp.test(url)) {
         Rise.Router.callController(route, url, params);
         return true;
       }
      });
      if(!exists) {
        //TODO: call 404 controller
        if(Rise.riseInstance.controllers['pages']) {
          Rise.riseInstance.controllers['pages'].invoke('404', 'pages');
        } else {
          throw new Error('Controller pages is not defined');
        }
      }
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

})();

(function() {

  Handlebars.registerHelper('yield', function() {
      return new Handlebars.SafeString('<div id="rise-render-here"></div>');
  });

  var getEventAndElement = function(str) {
    var split = str.split(' ');
    var evt = split.shift();
    var element = split.join(' ');
    return {
      event:  evt,
      element: element
    };
  };

  var render = function($element, url, data, cb) {
    $.get(url + '?_=' + Date.now(), function(response) {
      var template = Handlebars.compile(response);
      $element.html(template(data));
      //self.registerEvents();
    }).done(function() {
      cb.call(this);
    })
    .fail(function(response) {
      if(response.status == 404) {
        throw new Error('View file ' + url + ' wasn\'t found');
      } else {
        throw new Error('Error ' + response.status + ' while trying to load view');
      }
    });
  };

  var View = function View(path, template, events) {
    if(!_.isString(template)) {
      events = template;
      template = 'index';
    }
    this.url = 'views/' + path + '.html';
    this.template = 'views/templates/' + template + '.html';
    this.events = events;
    this.onLoad = function(){};
  };

  View.eventList = [];

  View.prototype.render = function(data) {
    self = this;
    //first, we render the template
    render($('body'), self.template, data, function() {
      //now, we render the view
      render($('#rise-render-here'), self.url, data, function() {
        //now we register the events
        self.unregisterEvents();
        self.registerEvents();
        self.onLoad.call(self);
      });
    });
  };

  View.prototype.renderAsElement = function(data, cb) {
    self = this;
    $.get(self.url + '?_=' + Date.now(), function(response) {
      var template = Handlebars.compile(response);
      self.registerEvents();
      cb.call(this, response);
    })
    .fail(function(response) {
      if(response.status == 404) {
        throw new Error('View file ' + self.url + ' wasn\'t found');
      } else {
        throw new Error('Error ' + response.status + ' while trying to load view');
      }
    });
  };

  View.prototype.unregisterEvents = function() {
    while(View.eventList.length !== 0) {
      var e = View.eventList.pop();
      $('body').off(e.evt, e.el, e.fn);
    }
  };

  View.prototype.registerEvents = function() {
    _.each(this.events, function(fn, key) {
      var params = getEventAndElement(key);
      $('body').on(params.event, params.element, fn);
      View.eventList.push({evt: params.event, el: params.element, fn: fn});
    });
  };

  Rise.View = View;

})();
