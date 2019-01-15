var express = require('express');
var fs = require('fs');

function Settings() {
    this.router = express.Router();

    var self = this;
    this.router.get('/update', (req, res) => {
        var {day, h, m, enabled, list, song} = req.query;
        self.update(day, h, m, enabled, list, song);
        self.getSettings((err, settings) => {
            res.send(settings[day]);
        })
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

Settings.prototype.update = (day, h, m, enabled, list, song) => {
    var self = this;
    this.getSettings((err, settings) => {
        settings[day] = {
            time: [
                h,
                m
            ],
            enabled: enabled,
            list: list,
            song: song
        };
        self.setSettings(settings);
    });
}


module.exports = Settings;