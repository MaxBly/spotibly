var express = require('express');
var fs = require('fs');

function Settings() {
    this.router = express.Router();

    var self = this;
    this.router.get('/update', (req, res) => {
        var { day, h, m, enabled, list, song } = req.query;
        self.update(self, day, h, m, enabled, list, song);
        self.getSettings((err,  settings) => {
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

Settings.prototype.setSettings = (data) => {
    fs.writeFileSync(__dirname + "/../json/settings.json", JSON.stringify(data, null, "\t"));
}

Settings.prototype.setTokens = (data) => {
    fs.writeFileSync(__dirname + "/../json/tokens.json", JSON.stringify(data, null, "\t"));
}

Settings.prototype.setClient = (data) => {
    fs.writeFileSync(__dirname + "/../json/client.json", JSON.stringify(data, null, "\t"));
}

Settings.prototype.update = (set, day, h, m, enabled, list, song) => {
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
        set.setSettings(settings);
    });
}


module.exports = Settings;