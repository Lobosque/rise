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

  Model.setAuth = function setAuth(l, p) {
    Rise.riseInstance.settings.login = l;
    Rise.riseInstance.settings.password = p;
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
    self = this;
    Model.getToken(function(err, token) {
      cb = cb || function(){};
      var requestData = {
        url: self.url,
        type: self.type,
        data: self.data,
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
          error = new Error(self.type + ' request at ' + self.url + ' timed out');
        } else if (status === 'error') {
          error = new Error(jqXHR.responseJSON.message);
        }
        cb.call(self, error, result);
      });
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
