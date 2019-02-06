const schedule = require('node-schedule');
const request = require('request');
const express = require('express');
const Settings = require('./settings');
const set = new Settings();
const SpotiblyApi = require('./spotibly-api');
const api = new SpotiblyApi();
const SpotifyLogger = require('./spotify-logger');
const log = new SpotifyLogger();

function Job(device) {
    this.router = express.Router();
    this.device = device;

    let self = this;

    this.router.get('/reload', (req, res) => {
        this.reload(data => {
            res.send(data);
        });
    });

    this.create = settings => {
        this.currentJob = schedule.scheduleJob(`${settings.time[1]} ${settings.time[0]} * * *`, this.job);
    }

    this.daily = _ => {
        let rule = new schedule.RecurrenceRule();
        rule.hour = 0;
        rule.minute = 0;

        this.rule = schedule.scheduleJob(rule, _ => {
            let day = new Date().getDay();
            set.getSettings((err, settings) => {
                self.create(settings[day]);
            })
        });
    }

    this.cancel = _ => {
        this.currentJob.cancel();
    }

    this.getNextInvoc = callback => {
        set.getSettings((err, settings) => {
            let error, data;
            try {
                let next = self.currentJob.nextInvocation();
                with (next) {
                    data = {
                        year: getFullYear(),
                        month: getMonth(),
                        date: getDate(),
                        day: getDay(),
                        hours: getHours(),
                        minutes: getMinutes(),
                    }
                }
                error = null;
            } catch (e) {
                error = 'no job';
                data = null;
            } finally {
                callback(error, data);
            }
        });
    }

    this.reload = callback => {
        let currentDate = new Date();
        let currentHours = currentDate.getHours()
        let currentMinutes = currentDate.getMinutes()
        let currentDay = currentDate.getDay()

        let nextInvoc = self.currentJob.nextInvocation();
        let jobHours = nextInvoc.getHours();
        let jobMinutes = nextInvoc.getHours();

        set.getSettings((err, settings) => {
            try {
                self.cancel();
                if (currentHours == jobHours) {
                    if (currentMinutes < jobMinutes) {
                        self.create(settings[currentDay])
                    } else {
                        if (currentDay == 6) self.create(settings[0])
                        else self.create(currentDay + 1);
                    }
                } else {
                    if (currentHours < jobHours) {
                        self.create(settings[currentDay])
                    }
                    else {
                        if (currentDay == 6) self.create(settings[0])
                        else self.create(currentDay + 1);
                    }
                }
                with (nextInvoc) {
                    callback(null, {
                        year: getFullYear(),
                        month: getMonth(),
                        date: getDate(),
                        day: getDay(),
                        hours: getHours(),
                        minutes: getMinutes(),
                    });
                }
            } catch (e) {
                callback('no job', null)
            }

        });
    }

    this.job = callback => {
        let day = new Date().getDay();
        let self = this;
        set.getSettings((err, settings) => {
            if (settings[day].enabled) {
                set.getTokens((err, tokens) => {
                    log.refreshToken(tokens => {
                        api.getDevices(devices => {
                            console.log({ device: devices[self.device], playlist: settings[day].playlist, startSong: settings[day].startSong });
                            api.putPlay(devices[self.device], settings[day].playlist, settings[day].startSong, (data) => {
                                //console.log("play", data)
                                request.get('http://localhost:7777/cmd/s/vu/0.1.0.1-0-1.1-0-1.1-0-1.1-0-1'); //this is just a request to start my leds & music app
                                api.putShuffle(devices[device], (data) => {
                                    //console.log("shuffle", data)
                                    if (callback && typeof callback == "function") callback({ devices, device, settings: settings[self.day], day: day });
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
