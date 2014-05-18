var settings = {
  baseUrl: 'http://0.0.0.0:8080',
  clientAuth: 'Basic ' + btoa('appFretista:password').toString('base64')
};

var replaceAll = function(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
};

var parseRestUrl = function(url) {
  var found = [];
  var regexp = /\:([^\/]+)(\/|$)/g;
  var currentMatch;

  while(currentMatch = regexp.exec(url)) {
    found.push(currentMatch[1]);
  }
  return found;
};

var Model = function Model(name) {
  this.name = name;
  this.baseUrl = settings.baseUrl;
};

Model.getToken = function getToken(email, password, cb) {
  cb = cb || function(){};
  $.ajax({
    type: 'POST',
    url: settings.baseUrl+'/token',
    data: {
      grant_type: 'password',
      username: email,
      password: password,
    },
    headers: {
      Authorization: settings.clientAuth
    }
  }).done(function(response) {
    settings.accessToken = response.access_token;
    cb.call(this, undefined, response.access_token);
  }).fail(function(response) {
    cb.call(this, new Error(response.responseJSON.error_description));
  });
};

Model.prototype.getUrl = function getUrl(endpoint) {
  var url = '';
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

Model.prototype.sync = function sync(cb) {
  cb = cb || function(){};
  var requestData = {
    url: this.url,
    type: this.type,
    data: this.data,
    contentType: 'application/json',
  };
  if(settings.accessToken) {
    requestData.headers = {
      Authorization: 'Bearer ' + settings.accessToken
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
