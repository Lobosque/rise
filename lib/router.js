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
    listener: function(event) {
      var input = location.hash.slice(1);
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
