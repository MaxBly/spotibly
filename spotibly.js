//require
const express = require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require('http');
const socketio = require("socket.io");

//const
const device = "Raspbly";
const owner = "max_bly";

//server
const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);

//libs
const SpotifyLogger = require('./lib/spotify-logger');
const Jobber = require('./lib/jobber');
const SpotiblyApi = require('./lib/spotibly-api');
const Settings = require('./lib/settings');

//init
const set = new Settings();
const logger = new SpotifyLogger();
const job = new Jobber(device);
const spotibly = new SpotiblyApi(owner);

//init server
app.use(cors());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use('/spotibly/logger', logger.router);
app.use('/spotibly/api', spotibly.router);
app.use('/spotibly/settings', set.router);
app.use('/spotibly/job', job.router);


job.loadAll();

io.sockets.on('connection', socket => {

    socket.emit('loggedin');

    socket.on('refresh_token', _ => {
        logger.refreshToken(_ => {
            socket.emit('token_ok');
        });
    });

    socket.on('getTracks', ({ index, playlist, sel }) => {
        let uri = playlist.split(':')
        let id = uri[uri.length - 1];
        spotibly.getTracks(id).then(tracks => {
            //console.log(tracks)
            socket.emit('loadTracks', { index, tracks, sel });
        });
    });

    socket.on('getPlaylists', _ => {
        spotibly.getPlaylists(owner, data => {
            socket.emit('loadPlaylists', data);
        });
    });

    socket.on('getSettings', _ => {
        set.getSettings((err, settings) => {
            spotibly.getDevices(devices => {
                spotibly.getPlaylists(owner, ({ playlists }) => {
                    settings.forEach((e, index) => {
                        let uri = e.playlist.split(':');
                        let id = uri[uri.length - 1];
                        spotibly.getTracks(id, ({ tracks }) => {
                            socket.emit('loadTracks', { index, tracks, startSong: e.startSong });
                        });
                    });
                    socket.emit('loadSettings', { settings, playlists, devices });
                });
            });
        });
    });

    socket.on('saveUpdate', ({ index, h, m, enabled, playlist, startSong }) => {
        set.update(set, index, h, m, enabled, playlist, startSong, (err, day) => {
            job.reload(day, (err, data) => {
                socket.emit('reloadOk', day);
                console.log('reloadOk', day);
            });
        });
    });

    socket.on('getNextInvoc', day => {
        console.log('getNextInvoc', day);

        job.getNextInvoc(day, (err, data) => {
            if (err) {
                socket.emit('loadNoJob', day);
            } else {
                socket.emit('loadNextInvoc', { i: day, data });
                console.log('loadNextInvoc', { i: day, data });
            }
        });
    });

});


server.listen(7800);
