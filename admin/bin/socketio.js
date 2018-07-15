const app = require('../../index'),
_ = require('lodash'),
debug = require('debug')('app:server'),
http = require('http'),
fs = require('fs'),
config = require('../config'),
port = normalizePort(process.env.PORT || config.port),
server = http.createServer(app),
io = require('socket.io')(server);
var clients = 0,
arr = [];

app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

//socket.io
var usr = [];
io.sockets.on("connection", function(socket){
  clients++;

  const socketList = {
    "msg": "newmsg",
    "postImg": "newimg",
    "postLink": "newlink",
    "userDetails": "userDetails"
  }

  function updateUsers(){
    var dat = _.clone(arr);
    var out = Object.keys(io.sockets.connected)
    _.forEach(out,function(i){
      if (i.length < 17){
        dat.push(i)
      }
    })
    io.sockets.emit('listUsers',dat);
  }

  socket.on('setUsername', function(data) {
      console.log(data);
      if(Object.keys(io.sockets.connected).indexOf(data) > -1) {
        socket.emit('userExists', 'username ' + data + ' is taken!');
      } else {

        socket.emit('userSet', {
          username: data,id:socket.id
        });

        socket.emit('newclientconnect',{
          description: 'Hey, welcome!'
        });

        socket.id = data
        io.sockets.connected[data] = io.sockets.connected[socket.id];
        updateUsers();

        io.sockets.emit('broadcast',{
           description: clients + ' users connected!'
        });

      }
   })

   socket.on('sendPrivate', function(data) {
      //console.log(data)
      io.to(data.pmId).emit('getPrivate', {
        user: data.user,
        id: data.id,
        message: data.message
      })
   })

   _.forIn(socketList,function(i,e){
     socket.on(e, function(data) {
        io.sockets.emit(i, data);
     })
   })

   socket.on('disconnect', function () {
      clients--;
      io.sockets.emit('broadcast',{
         description: clients + ' users connected!',
       });
       updateUsers()
   })

/*
   socket.on('msg', function(data) {
      io.sockets.emit('newmsg', data);
   })

   socket.on('postImg', function(data) {
      io.sockets.emit('newimg', data);
   })

   socket.on('postLink', function(data) {
      io.sockets.emit('newlink', data);
   })

   socket.on('userDetails', function(data) {
       io.sockets.emit('usersDetails', data);
   })
*/

});
