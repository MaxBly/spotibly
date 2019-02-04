var schedule = require('node-schedule');
var request = require('request');
var express = require('express');
var Settings = require('./settings');
var set = new Settings();
var SpotiblyApi = require('./spotibly-api');
var api = new SpotiblyApi();
var SpotifyLogger = require('./spotify-logger');
var log = new SpotifyLogger();

function Job(device) {
    this.router = express.Router();
    this.device = device;
    this.date = new Date();
    this.day = this.date.getDay();
    this.nextInvoc;

    this.router.get('/reload', (req, res) => {
        this.reload(data => {
            res.send(data);
        });
    });

    this.create = (settings) => {
        this.currentJob = schedule.scheduleJob(`${settings.time[1]} ${settings.time[0]} * * *`, this.job);
    }

    this.cancel = () => {
        this.currentJob.cancel();
    }

    this.getNextInvoc = (callback) => {
        var self = this;
        //console.log(self)
        set.getSettings((err, settings) => {
            let error, data;
            try {
                let next = self.currentJob.nextInvocation();
                self.nextInvoc = {
                    year: next.getFullYear(),
                    month: next.getMonth(),
                    date: next.getDate(),
                    day: next.getDay(),
                    hours: next.getHours(),
                    minutes: next.getMinutes(),
                    seconds: next.getSeconds(),
                }
                data = self.nextInvoc;
                error = null;
            } catch (e) {
                error = 1;
                data = null;
            } finally {
                callback(error, data);
            }
        });
    }

    this.reload = (callback) => {
        var self = this;
        set.getSettings((err, settings) => {
            //console.log(settings);
            try {
                self.cancel();
            } catch (e) {
                //console.log('no job')
            }
            self.create(settings[self.day]);
            let next = self.currentJob.nextInvocation();
            self.nextInvoc = {
                year: next.getFullYear(),
                month: next.getMonth(),
                date: next.getDate(),
                day: next.getDay(),
                hours: next.getHours(),
                minutes: next.getMinutes(),
                seconds: next.getSeconds(),
            }
            callback(self.nextInvoc);
        });
    }

    this.job = (callback) => {
        var self = this;
        set.getSettings((err, settings) => {
            if (settings[self.day].enabled) {
                set.getTokens((err, tokens) => {
                    log.refreshToken(tokens => {
                        api.getDevices(devices => {
                            console.log({ device: devices[self.device], playlist: settings[self.day].playlist, startSong: settings[self.day].startSong });
                            api.putPlay(devices[self.device], settings[self.day].playlist, settings[self.day].startSong, (data) => {
                                //console.log("play", data)
                                request.get('http://localhost:7777/cmd/s/vu/0.1.0.1-0-1.1-0-1.1-0-1.1-0-1'); //this is just a request to start my leds & music app
                                api.putShuffle(devices[self.device], (data) => {
                                    //console.log("shuffle", data)
                                    //if (callback) callback({ devices, device, settings: settings[self.day], day: self.day });
                                });
                            });
                        });
                    });
                });
            }
        });
    }
}


module.exports = Job;
