const request = require('request');
const express = require('express');
const qs = require("querystring");
const fs = require('fs');
const Settings = require('./settings.js');
const set = new Settings();

function rdmStr(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

function SpotifyLogger() {
    this.stateKey = 'spotify_auth_state';
    this.scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'user-read-private',
        'playlist-read-collaborative',
        'playlist-read-private',
        'user-read-email'
    ];

    this.burl = "https://api.spotify.com/v1/";
    this.storedState;
    this.state;

    this.router = express.Router();

    let self = this;

    this.router.get('/login', (req, res) => {
        //console.log('login');
        self.state = rdmStr(16);
        res.cookie(self.stateKey, self.state);
        set.getClient((err, client) => {
            //console.log(err, client)
            res.redirect('https://accounts.spotify.com/authorize?' +
                qs.stringify({
                    response_type: 'code',
                    client_id: client.id,
                    scope: self.scopes.join(" "),
                    redirect_uri: client.uri,
                    state: self.state
                })
            );
        });
    });

    this.router.get('/callback', (req, res) => {
        self.code = req.query.code || null;
        self.state = req.query.state || null;
        self.storedState = req.cookies ? req.cookies[self.stateKey] : null;
        set.getClient((err, client) => {
            if (self.state === null || self.state !== self.storedState) {
                res.redirect('/#' + qs.stringify({ error: 'state_mismatch' }));
            } else {
                res.clearCookie(self.stateKey);
                let authOptions = {
                    url: 'https://accounts.spotify.com/api/token',
                    form: {
                        code: self.code,
                        redirect_uri: client.uri,
                        grant_type: 'authorization_code'
                    },
                    headers: {
                        'Authorization': 'Basic ' + (new Buffer(client.id + ':' + client.secret).toString('base64'))
                    },
                    json: true
                };
                request.post(authOptions, (error, response, body) => {
                    set.getTokens((err, tokens) => {
                        if (!error && response.statusCode === 200) {
                            let { access_token, refresh_token } = body;
                            tokens = { access_token, refresh_token };
                            set.setTokens(tokens);
                            res.send(JSON.stringify(tokens, null, "\t"));
                        } else {
                            res.redirect('/#' +
                                qs.stringify({
                                    error: 'invalid_token'
                                })
                            );
                            res.send(tokens);
                        }
                    });
                });
            }
        });
    });

    this.router.get('/refresh_token', (req, res) => {
        self.refreshToken();
        set.getTokens((err, tokens) => {
            res.send(tokens);
        });
    });

}

SpotifyLogger.prototype.refreshToken = (callback) => {
    set.getTokens((err, tokens) => {
        set.getClient((err, client) => {
            let authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                headers: { 'Authorization': 'Basic ' + (new Buffer(client.id + ':' + client.secret).toString('base64')) },
                form: {
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refresh_token
                },
                json: true
            };
            //console.log(authOptions)
            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    let { access_token } = body;
                    let refresh_token = tokens.refresh_token;
                    tokens = { access_token, refresh_token };
                    set.setTokens(tokens);
                    if (callback) callback(tokens);
                }
            });
        });
    });
}


module.exports = SpotifyLogger;