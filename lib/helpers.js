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
