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
  };

})();
