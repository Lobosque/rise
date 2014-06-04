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
    this.settings = settings;
    // Listen on hash change:
    window.addEventListener('hashchange', Rise.Router.listener);
    // Listen on page load:
    window.addEventListener('load', Rise.Router.listener);
    Rise.riseInstance = this;
    this.controllers = {};
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
    if(this.actions[action]) {
      //execute the action itself
      this.actions[action].call(this);
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
  // helper function to find and replace all occurrences
  var replaceAll = function(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
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
  Model.getToken = function getToken(email, password, cb) {
    cb = cb || function(){};
    $.ajax({
      type: 'POST',
      url: Rise.riseInstance.settings.baseUrl+'/authenticate',
      data: {
        grant_type: 'password',
        username: email,
        password: password,
      },
      headers: {
        Authorization: Rise.riseInstance.settings.clientAuth
      }
    //TODO: replace with complete
    }).done(function(response) {
      Rise.riseInstance.settings.accessToken = response.access_token;
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
    if(Rise.riseInstance.settings.accessToken) {
      requestData.headers = {
        Authorization: 'Bearer ' + Rise.riseInstance.settings.accessToken
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

  Rise.Router = {
    routes: [],
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
    listener: function(event) {
      var input = location.hash.slice(1);
      var url, params;
      //check if we have params (?foo=bar) and extract them;
      if(input.indexOf('?') === -1) {
        url = trimSlashes(input) || '/';//TODO: must be able to set a default controller and action for '/'
      } else {
        url = trimSlashes(input.split('?')[0]) || '/';//TODO: must be able to set a default controller and action for '/'
        params = urlToArray(input.split('?')[1]);
      }
      //find the handler for this url
      var exists = _.any(Rise.Router.routes, function(route) {
       if(route.regexp.test(url)) {
         Rise.Router.callController(route, url, params);
         return true;
       }
      });
      if(!exists) {
        //TODO: call 404 controller
        console.log('404: route doesn\'t exist');
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

  var getEventAndElement = function(str) {
    var split = str.split(' ');
    var evt = split.shift();
    var element = split.join(' ');
    return {
      event:  evt,
      element: element
    };
  };

  var View = function View(path, events) {
    this.url = 'views/' + path + '.html';
    this.events = events;
  };

  View.settings = {
    renderTo: 'body'
  };

  View.prototype.render = function(data) {
    $element = $(View.settings.renderTo);
    self = this;
    $.get(self.url, function(response) {
      var template = Handlebars.compile(response);
      $element.html(template(data));
      self.registerEvents();
    })
    .fail(function(response) {
      if(response.status == 404) {
        throw new Error('View file ' + self.url + ' wasn\'t found');
      } else {
        throw new Error('Error ' + response.status + ' while trying to load view');
      }
    });
  }

  View.prototype.renderAsElement = function(data, cb) {
    self = this;
    $.get(self.url, function(response) {
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

  View.prototype.registerEvents = function() {
    _.each(this.events, function(fn, key) {
      var params = getEventAndElement(key);
      $(View.settings.renderTo).on(params.event, params.element, fn);
    });
  }

  Rise.View = View;

})();
