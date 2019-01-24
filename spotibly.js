//require
var express = require('express');
var cors = require("cors");
var cookieParser = require("cookie-parser");
var http = require('http');
var socketio = require("socket.io");

//const
require('dotenv').config();

const device = process.env.DEVICE;
const owner = process.env.OWNER;

//server
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

//libs
var SpotifyLogger = require('./lib/spotify-logger');
var Jobber = require('./lib/jobber');
var SpotiblyApi = require('./lib/spotibly-api');
var Settings = require('./lib/settings');

//init
var logger = new SpotifyLogger();
var job = new Jobber(device);
var spotibly = new SpotiblyApi(owner);
var set = new Settings();

//init server
app.use(cors());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use('/spotibly/logger', logger.router);
app.use('/spotibly/api', spotibly.router);
app.use('/spotibly/settings', set.router);
app.use('/spotibly/job', job.router);

//job.job();
set.getSettings((err, settings) => {
    console.log(settings[job.day]);
    job.create(settings[job.day]);
});

io.sockets.on('connection', socket => {

    socket.emit('loggedin');

    socket.on('refresh_token', () => {
        logger.refreshToken(() => {
            socket.emit('token_ok');
        });
    });

    socket.on('getTracks', ({index, playlist, sel}) => {
        let uri = playlist.split(':')
        let id = uri[uri.length - 1];
        //console.log({playlist, uri, id});
        spotibly.getTracks(id, ({tracks}) => {
            console.log(tracks)
            socket.emit('loadTracks', {index, tracks, sel});
        });
    });

    socket.on('getPlaylists', () => {
        spotibly.getPlaylists(owner, data => {
            socket.emit('loadPlaylists', data);
        });
    });

    socket.on('getSettings', () => {
        set.getSettings((err, settings) => {
            spotibly.getPlaylists(owner, ({ playlists }) => {
                settings.forEach((e, index) => {
                    let uri = e.playlist.split(':');
                    let id = uri[uri.length - 1];
                    spotibly.getTracks(id, ({ tracks }) => {
                        socket.emit('loadTracks', { index, tracks, startSong: e.startSong });
                        console.log(tracks)
                    });
                });
                console.log({ settings, playlists});
                socket.emit('loadSettings', { settings, playlists});
            });
        });
    });

    socket.on('saveUpdate', ({index, h, m, enabled, playlist, startSong}) => {
        set.update(set, index, h, m, enabled, playlist, startSong);
    });

    socket.on('reload', () => {
        job.reload(data => {
            socket.emit('loadNextInvoc', data);
        });
    });

    socket.on('getNextInvoc', () => {
        job.getNextInvoc((err, data) => {
            if (err) {
                socket.emit('loadNoJob');
            } else {
                socket.emit('loadNextInvoc', data);
            }
        });
    });
});


server.listen(7800);
