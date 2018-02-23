const http = require('http');
const socketio = require('socket.io');

const app = http.createServer((req, res) => {
  res.end('hello');
});

app.listen(8000);

const io = socketio(app);

io.on('connection', socket => {
  socket.on('control', data => {
    socket.broadcast.emit('control', data);
  });
});
