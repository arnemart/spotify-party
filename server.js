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

  socket.on('join', data => {
    socket.join(data.key);
    if (djs[data.key] && djs[data.key].playing) {
      socket.emit('control', {
        action: 'track',
        url: djs[data.key].url,
        position: djs[data.key].position
      });
    }
  });

  socket.on('control', data => {
    if (djs[data.key].id == socket.id) {
      io.to(data.key).emit('control', data);

      if (data.url) {
        djs[data.key].url = data.url;
      }
      if (data.position) {
        djs[data.key].position = data.position;
      }
      if (data.action == 'pause') {
        djs[data.key].playing = false;
      }
      if (data.action == 'track') {
        djs[data.key].playing = true;
      }
    } else {
      socket.emit('message', 'You are not the dj of this party');
    }
  });

  socket.on('update-position', data => {
    if (djs[data.key].id == socket.id) {
      djs[data.key].position = data.position;
    }
  });

  socket.on('dj', data => {
    if (djs[data.key]) {
      socket.emit('message', 'This party already has a dj!');
    } else {
      djs[data.key] = {
        id: socket.id,
        url: null,
        position: 0,
        playing: false
      };
      socket.emit('message', 'You are now the dj of this party');
    }
  });

  socket.on('disconnect', data => {
    let newdjs = {};
    for (let key in djs) {
      if (djs[key].id != socket.id) {
        newdjs[key] = djs[key];
      }
    }
    djs = newdjs;
  });
});
