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
  };

  View.prototype.render = function(data) {
    self = this;
    //first, we render the template
    render($('body'), self.template, data, function() {
      console.log(self);
      //now, we render the view
      render($('#rise-render-here'), self.url, data, function() {
        //now we register the events
        console.log(self);
        self.registerEvents();
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

  View.prototype.registerEvents = function() {
    _.each(this.events, function(fn, key) {
      var params = getEventAndElement(key);
      $('body').on(params.event, params.element, fn);
    });
  }

  Rise.View = View;

})();
