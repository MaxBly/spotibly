var express = require('express');
var request = require('request');
var fs = require('fs');
var Settings = require('./settings');
var set = new Settings();

function option(method, url, code, dataString, id) {
    if (!id) id = "";
    var option = {
        url: "https://api.spotify.com/v1/" + url + id,
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + code
        }
    }
    if (dataString) option.body = JSON.stringify(dataString, null, null);
    return option;
}



function SpotiblyApi(owner) {
    this.owner = owner;

    this.router = express.Router();

    var self = this;

    this.router.get('/devices', (req, res) => {
        self.getDevices(dev => {
            console.log(dev)
            res.json(dev);
        });
    });

    this.router.get('/nowplaying', (req, res) => {
        self.getNowPlaying(listening => {
            res.json(listening);
        });
    });

    this.router.get('/playlists', (req, res) => {
        self.getPlaylists(self.owner, playlists => {
            res.json(playlists);
        });
    });

    this.router.get('/tracks', (req, res) => {
        var { id } = req.query;
        self.getTracks(id, tracks => {
            res.json(tracks);
        });
    });

    this.router.get('/next', (req, res) => {
        var { id } = req.query;
        self.postNext(id, status => {
            res.json(status);
        });
    });

    this.router.get('/shuffle', (req, res) => {
        var { id } = req.query;
        self.postShuffle(id, status => {
            res.json(status);
        });
    });

    this.router.get('/play', (req, res) => {
        let { id, list, song } = req.query || null;
        seld.putPlay(id, list, song, status => {
            res.json(status)
        });
    });

}



SpotiblyApi.prototype.getDevices = (callback) => {
    set.getTokens((err, tokens) => {
        request(
            option('GET', 'me/player/devices', tokens.access_token), (err, response, body) => {
                if (response.statusCode == 200) {
                    var data = JSON.parse(body);
                    var dev = [];
                    data.devices.forEach(e => {
                        dev[e.name] = e.id;
                    });
                    callback(dev);
                }
            }
        );
    });
}

SpotiblyApi.prototype.getNowPlaying = (callback) => {
    set.getTokens((err, tokens) => {
        request(
            option('GET', 'me/player/currently-playing', tokens.access_token), (err, response, body) => {
                rep = JSON.parse(body);
                console.log(rep)
                var next = rep.item.duration_ms - rep.progress_ms,
                    listening = {
                        next: next,
                        context: {
                            type: rep.context.type,
                            uri: rep.context.uri
                        },
                        item: {
                            name: rep.item.name,
                            artist: {
                                name: rep.item.artists[0].name,
                                id: rep.item.artists[0].id
                            },
                            album: {
                                name: rep.item.album.name,
                                id: rep.item.album.id,
                                img: rep.item.album.images[1].url
                            },
                            id: rep.item.id,
                        }
                    }
                callback(listening);
            }
        );
    });
}

SpotiblyApi.prototype.putPlay = (id, list, song, callback) => {
    if (!song) song = "";
    set.getTokens((err, tokens) => {
        request(
            option('PUT', 'me/player/play?device_id=', tokens.access_token, { "context_uri": list, "offset": (song) ? { "uri": song } : {} }, id),
            (err, response, body) => {
                callback(response.statusCode);
            }
        );
    });
}

SpotiblyApi.prototype.getPlaylists = (owner, callback) => {
    set.getTokens((err, tokens) => {
        request(
            option('GET', 'me/playlists?limit=50', tokens.access_token), (err, response, body) => {
                var results = { playlists: [] };
                var playlists = JSON.parse(body);
                playlists.items.forEach((e, i) => {
                    if (e.owner.display_name == owner)
                        results.playlists.push([e.name, e.uri]);
                });
                results.next = playlists.next;
                callback(results);
            }
        );
    });
}

SpotiblyApi.prototype.getTracks = (id, callback) => {
    set.getTokens((err, tokens) => {
        request(
            option('GET', 'playlists/' + id + '/tracks', tokens.access_token), (err, response, body) => {
                var results = { tracks: [] };
                var tracks = JSON.parse(body);
                tracks.items.forEach((e, i) => {
                    results.tracks[i] = { name: e.track.name, uri: e.track.uri, artists: [], album: e.track.album.name };
                    e.track.album.artists.forEach(el => { results.tracks[i].artists.push({ name: el.name, uri: el.uri }) })
                });
                results.next = tracks.next;
                callback(results);
            }
        );
    });
}

SpotiblyApi.prototype.postShuffle = (id, callback) => {
    set.getTokens((err, tokens) => {
        request(
            option('POST', 'me/player/shuffle?state=true&device_id=', tokens.access_token, null, id),
            (err, response, body) => {
                callback(response.statusCode);
            }
        );
    });
}

SpotiblyApi.prototype.postNext = (id, callback) => {
    set.getTokens((err, tokens) => {
        request(
            option('POST', 'me/player/next?device_id=', tokens.access_token, null, id),
            (err, response, body) => {
                callback(response.statusCode);
            }
        );
    });
}

module.exports = SpotiblyApi;