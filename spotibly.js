//require
var express = require('express');
var cors = require("cors");
var cookieParser = require("cookie-parser");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });


//const
const device = 'unit-bly';
const owner = 'max_bly';

//server
var app = express();

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
/* 
var test = {
    enabled: true,
    time: [
        19,
        24
    ],
    playlist: "spotify:user:max_bly:playlist:3zrpDxV3XcJOuuCosaoM2t",
    startSong: "spotify:track:4l0LQNOfh7jWZUJ8kHpGZR"
} */

//job.create(test);

set.getSettings((err, settings) => {
    console.log(settings[job.day]);
    job.create(settings[job.day]);
});
app.listen(7800);