Rise
=========

Overview
---
To build the library:
```
gulp build
```

Getting Started
---
Rise is a singleton, you instantiate it by passing in a settings object: 
```
var rise = new Rise({
  baseUrl: 'http://0.0.0.0:8080',
  clientAuth: 'Basic ' + btoa('appFretista:password').toString('base64')
});
```

Model
---
Our model was inspired by [cakePHP].
Each model is a singleton:
```javascript
usersModel = new rise.Model('users');
```

The model was conceived to interact with a RESTful API, and has the following methods:
```javascript
usersModel.post(data, cb); //POST /users
usersModel.get(cb); //GET /users
usersModel.put(id, data, cb); //PUT /users
usersModel.del(id, cb); //DELETE /users
```

`cb` is a function that will be called when the API call is finished, it has the arguments `err` and `result`:
```javascript
var cb = function(err, result) {
 //err -> if the API call returns an error it will be here.
 //result -> An object representing the JSON response from the API.
});

``` 

For the `get` function, it is also possible to send an id in order to get a specific resource:
```javascript
usersModel.get(cb); //GET /users
usersModel.get(45, cb); //GET /users/45
```

All functions can receive an `endpoint` argument to override the convention:
```javascript
usersModel.post(data, '/foo', cb); //POST /foo
```

It is also possible to use arguments in the overriden endpoint:
```javascript
usersModel.get(24, {profileId: 67}, '/users/:id/profile/:profileId', cb); //GET /users/24/profile/67
```

###Authorization

The model assumes that the API uses the [ROPC] OAuth2 flow, the token is set globally using the `getToken` function:
```javascript
Model.getToken(username, password, cb);
```

Once the token is set, all API call will use it in the Authorization header



Controller
---

The controller contains the code that will be executed according to the route associated to it. Each controller has one or more actions:
The constructor takes 2 arguments: 
```javascript
var controllerName = 'users';
var actions = {
  view: function() {
    //...
  },
  update: function() {
    //...
  },
  //...
};
var usersController = new rise.Controller(controllerName, actions);
```

By convention, the first part of the route represents the controller, and the second part represents the action:
```javascript
var actions = {
  create: function() {
    //the route /#/users/create executes this action
  }
};
```

The only exception is the action `index`, that only needs the first part of the route to be executed:
```javascript
var actions = {
  index: function() {
    //a rota /#/users executes this action
  }
};
```

The third part and onwards represents the arguments of the action:
```javascript
var actions = {
  view: function(id) {
    //a rota /#/users/create/45 executes this action
    console.log(id); //45
  }
};
```

It is also possible to pass url parameters:
```javascript
var actions = {
  index: function() {
    //se chamado com /#/users?orderBy=name&desc=true
    console.log(this.data); // {orderBy: 'name', desc: 'true'}
  }
};
```

All routes must be prefixed with `/#`.
The flow of an action usually ends by rendering a view.


View
---
View are represented by a template (html file using [handlebars]) and a corresponding javascript function that will call it.

Example of a template:
```html
<p>Hello {{name}}!</p>
```
By convention, the templates are stored in views folder.

To create a new view:
```javascript
var path = 'users/list.html';
var events = {
  'click #foo': function(e) {
    e.preventDefault();
    alert('bar');
  }
};
userListView = new rise.View(path, events);
```
`events` is a object where the key represents the event to watch for and the element, and the value is the function that will be called when the event is triggered.

To render the view (usually inside a controller action):
```javascript
userListView.render(data);
```

By convention, the view will render directly into the body.

to change where the view is rendered:
```javascript
Rise.settings.renderTo = '#id';
```

Instead rendering the template straight into the document, you can get the result in a variable using `renderAsElement`:
```
var element;
userListView.renderAsElement(data, function(res) {
  element = res;
});
```

TODO
---
* Data binding
* 404

[cakePHP]:http://cakephp.org/
[ROPC]:http://tools.ietf.org/html/rfc6749#page-57
[handlebars]:http://handlebarsjs.com/
