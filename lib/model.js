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
