const express = require('express');
const fs = require('fs');

function Settings() {
    this.router = express.Router();

    let self = this;
    this.router.get('/update', (req, res) => {
        var { day, h, m, enabled, list, song } = req.query;
        self.update(self, day, h, m, enabled, list, song);
        self.getSettings((err, settings) => {
            res.send(settings[day]);
        })
    });

    this.router.get('/', (req, res) => {
        self.getSettings((err, data) => {
            res.json(data);
        });
    });
    this.router.get('/pannel', (req, res) => {
        self.getSettings((err, data) => {
            res.render(__dirname + "/../public/pannel.ejs", { settings: data });
        });
    });
}

Settings.prototype.getSettings = (callback) => {
    fs.readFile(__dirname + "/../json/settings.json", (err, data) => {
        if (err) callback(err);
        else callback(null, JSON.parse(data));
    });
}

Settings.prototype.getTokens = (callback) => {
    fs.readFile(__dirname + "/../json/tokens.json", (err, data) => {
        if (err) callback(err);
        else callback(null, JSON.parse(data));
    });
}

Settings.prototype.getClient = (callback) => {
    fs.readFile(__dirname + "/../json/client.json", (err, data) => {
        if (err) callback(err);
        else callback(null, JSON.parse(data));
    });
}

Settings.prototype.setSettings = (data, callback) => {
    fs.writeFile(__dirname + "/../json/settings.json", JSON.stringify(data, null, "\t"), err => {
        if (typeof callback == "function") {
            if (err) {
                callback(err, null);
            } else {
                callback(null, data);
            }
        }
    });
}

Settings.prototype.setTokens = (data, callback) => {
    fs.writeFile(__dirname + "/../json/tokens.json", JSON.stringify(data, null, "\t"), err => {
        if (typeof callback == "function") {
            if (err) {
                callback(err, null);
            } else {
                callback(null, data);
            }
        }
    });
}

Settings.prototype.setClient = (data, callback) => {
    fs.writeFile(__dirname + "/../json/client.json", JSON.stringify(data, null, "\t"), err => {
        if (typeof callback == "function") {
            if (err) {
                callback(err, null);
            } else {
                callback(null, data);
            }
        }
    });
}

Settings.prototype.update = (set, day, h, m, enabled, list, song, callback) => {
    set.getSettings((err, settings) => {
        settings[day] = {
            time: [
                parseInt(h),
                parseInt(m)
            ],
            enabled: JSON.parse(enabled),
            playlist: list,
            startSong: song
        };
        set.setSettings(settings, err => {
            if (typeof callback == "function") callback(err, day)
        });
    });
}


module.exports = Settings;