const http = require('http');
const socketio = require('socket.io');

const app = http.createServer((req, res) => {
  res.end('hello');
});

app.listen(process.env.PORT || 8000);

const io = socketio(app);

let djs = {};

io.on('connection', socket => {
  socket.emit('message', 'Welcome to the party!');

  socket.on('control', data => {
    if (djs[data.key] == socket.id) {
      io.to(data.key).emit('control', data);
    } else {
      socket.emit('message', 'You are not the dj of this party');
    }
  });

  socket.on('dj', data => {
    if (djs[data.key]) {
      socket.emit('message', 'This party already has a dj!');
    } else {
      djs[data.key] = socket.id;
      socket.emit('message', 'You are now the dj of this party');
    }
  });

  socket.on('disconnect', data => {
    let newdjs = {};
    for (let key in djs) {
      if (djs[key] != socket.id) {
        newdjs[key] = djs[key];
      }
    }
    djs = newdjs;
  });
});
