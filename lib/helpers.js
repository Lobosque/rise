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
      login: function(email, password, remember) {
        if(remember) {
          localStorage.setItem('email', email);
          localStorage.setItem('password', password);
        }
        Rise.Helpers.Auth.setAuth(email, password);
        window.location = '/#/users/';
      },
    }
  };
})();
