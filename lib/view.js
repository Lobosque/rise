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
    $.get(self.url + '?_=' + Date.now(), function(response) {
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

  View.prototype.registerEvents = function() {
    _.each(this.events, function(fn, key) {
      var params = getEventAndElement(key);
      $(View.settings.renderTo).on(params.event, params.element, fn);
    });
  }

  Rise.View = View;

})();
