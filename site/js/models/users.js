var rise = new Rise({
  baseUrl: 'http://0.0.0.0:8080',
  clientAuth: 'Basic ' + btoa('appFretista:password').toString('base64')
});

var usersModel = new rise.Model('users');
