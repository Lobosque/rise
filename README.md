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

View
---

TODO
---
* Handle Events
* Data binding
* 404

[cakePHP]:http://cakephp.org/
