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
    this.rules = [];
    this.jobs = [];

    let self = this;

    this.router.get('/reload', (req, res) => {
        this.reload(data => {
            res.send(data);
        });
    });
    this.cancel = day => {
        if (this.jobs[day]) this.jobs[day].cancel();
    }

    this.getNextInvoc = (day, callback) => {
        console.log(this.jobs[day])
        if (this.jobs[day]) {
            let data;
            with (self.jobs[day].nextInvocation()) {
                data = {
                    year: getFullYear(),
                    month: getMonth(),
                    date: getDate(),
                    day: getDay(),
                    hours: getHours(),
                    minutes: getMinutes()
                }
            }
            if (typeof callback == "function") callback(null, data);
        } else {
            callback("no job", null);
        }
    }

    this.loadAll = callback => {
        set.getSettings((err, settings) => {
            if (err && typeof callback == 'function') callback(err, null)
            settings.forEach((e, i) => {
                if (e.enabled) {
                    self.rules[i] = new schedule.RecurrenceRule()
                    self.rules[i].dayOfWeek = i;
                    self.rules[i].hour = e.time[0];
                    self.rules[i].minute = e.time[1];
                    self.jobs[i] = schedule.scheduleJob(self.rules[i], _ => { self.job(i) });
                } else {
                    self.rules[i] = null;
                }
            });
        });
        if (typeof callback == 'function') callback(null, this.jobs);
    }

    this.reload = (day, callback) => {
        set.getSettings((err, settings) => {
            if (settings[day].enabled) {
                this.cancel(day);
                self.rules[day] = new schedule.RecurrenceRule();
                self.rules[day].day = day;
                self.rules[day].hour = settings[day].time[0];
                self.rules[day].minute = settings[day].time[1];
                self.jobs[day] = schedule.scheduleJob(self.rules[day], _ => { self.job(day) });
                console.log('reloaded', this.jobs[day])
            } else {
                self.rules[day] = null;
            }
            if (typeof callback == 'function') {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, day);
                }
            }

        });
    }

    this.job = (day, callback) => {
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
