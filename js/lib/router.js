var Router = {
  routes: {},
  register: function register(path, controller, action) {  
    Router.routes[path] = {
      regexp: Router.routeToRegExp(path),
      controller: controller,
      action: action || 'index'
    };
  },
  listener: function(event) {
    console.log('foo');
    console.log(event);
    var url = location.hash.slice(1) || '/';
    console.log(url);
    if(Router.routes[url) {
      var args = Router.extractParameters(Router.routes[url], url);
      //time to drink beer, continue tomorrow morning!
    }
  },
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
  },
    extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }
};

// Listen on hash change:
window.addEventListener('hashchange', Router.listener);  
// Listen on page load:
window.addEventListener('load', Router.listener);  
