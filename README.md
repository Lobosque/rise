Rise
=========

Overview
---
To build the library:
```
gulp build
```

Model
---
O nosso model foi baseado no do [cakePHP].
Cada modelo é um singleton:
```javascript
usersModel = new rise.Model('users');
```

O modelo foi feito para pegar os dados de uma API rest, e conta com os seguintes métodos:
```javascript
usersModel.post(data, cb); //POST /users
usersModel.get(cb); //GET /users
usersModel.put(id, data, cb); //PUT /users
usersModel.del(id, cb); //DELETE /users
```

O `cb` é uma função que será chamada quando a chamada a API for executada, ele recebe os argumentos `err` e `result`:
```javascript
var cb = function(err, result) {
 //err -> se a chamada retornar um erro, ele estará disponível aqui
 //result -> um objeto reprensentando o JSON enviado como resposta pela API
});

``` 

Para a função `get`, é possível também mandar um id para pegar um recurso específico:
```javascript
usersModel.get(cb); //GET /users
usersModel.get(45, cb); //GET /users/45
```

Todas as funções podem também receber um argumento `endpoint`, para fazer override da convenção utilizada:
```javascript
usersModel.post(data, '/foo', cb); //POST /foo
```

É possível também usar argumentos para sobreescrever o `endpoint`, por exemplo:
```javascript
usersModel.get(24, {profileId: 67}, '/users/:id/profile/:profileId', cb); //GET /users/24/profile/67
```

Controller
---

O *controller* contém o código que será executado de acordo com a rota associada a ele. Cada *controller* possui uma ou mais *actions*.
O construtor leva 2 argumentos: nome do *controller* e um objeto com as *actions*:
```
var usersController = new rise.Controller(controllerName, actions);
```

Por convenção, a primeira parte da rota representa o controller e a segunda parte representa a ação:
```
var actions = {
  create: function() {
    //a rota /#/users/create executa esta action
    this.done();
  }
}
```

A única exceção é a *action* `index`, que necessita apenas da primeira parte para ser executada:
```
var actions = {
  index: function() {
    //a rota /#/users executa esta action
    this.done();
  }
}
```

A terceira parte em diante representa argumentos da ação:
```
var actions = {
  view: function(id) {
    //a rota /#/users/create/45 executa esta action
    console.log(id); //45
    this.done();
  }
}
```

Além disso, é possivel passar *url params*:
```
var actions = {
  index: function() {
    //se chamado com /#/users?orderBy=name&desc=true
    console.log(this.data); // {orderBy: 'name', desc: 'true'}
    this.done();
  }
}
```

A função `this.done()`deve ser chamada para indicar que o controller foi executado, passando então
para a  parte de renderização.

View
---

TODO
---
* Handle Events
* Data binding
* 404

[cakePHP]:http://cakephp.org/
