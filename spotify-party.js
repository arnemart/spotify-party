#!/usr/bin/env node

const spotify = require('spotify-node-applescript');
const io = require('socket.io-client');

const [_, __, server, key, mode = 'client'] = process.argv;


if (!server || !key || !mode) {
  console.log("Usage: spotify-party http://server party-key [dj]");
  process.exit();
}

const socket = io(server);

socket.on('message', console.log);

if (mode == 'dj') {
  let currentTrack;
  let currentPos;
  let playing = false;

  socket.emit('dj', { key: key });

  setInterval(_ => {
    spotify.getTrack((err, track) => {
      if (err) {
        console.log(err);
        return;
      }
      spotify.getState((err, state) => {
        if (err) {
          console.log(err);
          return;
        }

        if (state.state == 'playing') {
          if (!playing) {
            playing = true;
            socket.emit('control', { action: 'track', url: track.spotify_url, position: state.position, key: key });
          } else {
            if (track.spotify_url != currentTrack) {
              socket.emit('control', { action: 'track', url: track.spotify_url, key: key });
            } else if (track.spotify_url == currentTrack && state.position < currentPos - 5 || state.position > currentPos + 5) {
              socket.emit('control', { action: 'track', url: track.spotify_url, position: state.position, key: key });
            } else if (currentPos != state.position) {
              socket.emit('update-position', { position: state.position, key: key });
            }
          }
          currentTrack = track.spotify_url;
          currentPos = state.position;
        } else {
          if (playing) {
            playing = false;
            socket.emit('control', { action: 'pause', key: key });
          }
        }
      });
    });
  }, 1000);

} else if (mode == 'client' || mode == 'verbose') {
  socket.emit('join', { key: key });

  socket.on('control', data => {
    if (mode == 'verbose') {
      console.log(data);
    }
    switch (data.action) {
    case 'pause':
      spotify.pause();
      break;
    case 'track':
      spotify.playTrack(data.url);
      if (data.position) {
        setTimeout(_ => spotify.jumpTo(data.position), 200);
      }
    }
  });
}
