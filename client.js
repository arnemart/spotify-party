const spotify = require('spotify-node-applescript');
const io = require('socket.io-client');

const socket = io('http://localhost:8000');

if (process.argv[2] == 'master') {
  let currentTrack;
  let currentPos;
  let playing = false;

  setInterval(_ => {
    spotify.getTrack((err, track) => {
      spotify.getState((err, state) => {
        if (state.state == playing) {
          if (!playing) {
            playing = true;
            socket.emit('control', { action: 'track', url: currentTrack, position: state.position });
          } else {
            if (track.spotify_url != currentTrack) {
              currentTrack = track.spotify_url;
              if (state.position < currentPos - 5 || state.position > currentPos + 5) {
                socket.emit('control', { action: 'track', url: currentTrack, position: state.position });
              } else {
              socket.emit('control', { action: 'track', url: currentTrack });
              }
            }
          }
          currentPos = state.position;
        } else {
          if (playing) {
            playing = false;
            socket.emit('control', { action: 'pause' });
          }
        }
      });
    });
  }, 1000);

} else {
  socket.on('control', data => {
    switch (data.action) {
    case 'play':
      spotify.play();
      break;
    case 'pause':
      spotify.pause();
      break;
    case 'track':
      spotify.playTrack(data.url);
      if (data.position) {
        spotify.jumpTo(data.position);
      }
    }
  });
}
