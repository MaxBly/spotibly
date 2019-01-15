var schedule = require('node-schedule');
var request = require('request');
var Settings = require('./settings');
var set = new Settings();
var SpotiblyApi = require('./spotibly-api');
var api = new SpotiblyApi();
var SpotifyLogger = require('./spotify-logger');
var log = new SpotifyLogger();

function Job(device) {
    this.device = device;
    this.currentJob;
    this.date = new Date();
    this.day = this.date.getDay();
    this.nextInvoc;
}

Job.prototype.create = (settings) => {
    this.currentJob = schedule.scheduleJob(`${settings.time[1]} ${settings.time[0]} * * *`, this.job);
}

Job.prototype.cancel = () => {
    this.currentJob.cancel();
}

Job.prototype.reload = () => {
    var self = this;
    return set.getSettings(settings => {
        self.cancel();
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
        return self.nextInvoc;
    });
}

Job.prototype.job = () => {
    var self = this;
    set.getSettings(settings => {
        if (settings[self.day].enabled) {
            set.getTokens(tokens => {
                log.refreshToken();
                api.getDevices(devices => {
                    api.putPlay(devices[self.device], settings[self.day].playlist, settings[self.day].startSong, () => {
                        request.get('http://localhost:7777/cmd/s/vu/0.1.0.1-0-1.1-0-1.1-0-1.1-0-1'); //this is just a request to start my leds & music app
                        api.postShuffle(devices[self.device], () => {
                            console.log(`{${devices}}\n{${settings[self.day].playlist}\n${settings[self.day].startSong}}\n`)
                        });
                    });
                });
            });
        }
    });
}


module.exports = Job;