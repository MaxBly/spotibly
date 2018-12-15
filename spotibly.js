#!/usr/sbin/node
var request = require ("request");
var express = require ("express");
var qs = require("querystring");
var cors = require("cors");
var schedule = require("node-schedule");
var cookieParser = require("cookie-parser");
var fs = require("fs");
var app = express();
var client = require("/prgm/spotibly/client.json");
var settings = require("/prgm/spotibly/settings.json");

var date = new Date(), D = date.getDay();

var burl = "https://api.spotify.com/v1/",
	tokens, devices = {}, stateKey = 'spotify_auth_state',
	scopes = [
		'user-read-playback-state',
		'user-modify-playback-state',
		'user-read-currently-playing',
		'user-read-playback-state',
		'user-read-private',
		'user-read-email'
	];


var j = schedule.scheduleJob(`${settings[D].time[1]} ${settings[D].time[0]} * * *`, () => {
	console.log(`[${D}][${settings[D].time[0]}h${settings[D].time[0]}](${settings[D].enabled})`);
	if (settings[D].enabled) {
		request.get('http://localhost:7800/spotibly/refresh_token', () => {
			request.get('http://localhost:7800/spotibly/devices', (e, r, dev) => {
				devices = JSON.parse(dev);
				request.get('http://localhost:7777/cmd/s/vu/0.1.0.1-0-1.1-0-1.1-0-1.1-0-1');
				request.get('http://localhost:7800/spotibly/play?id='+devices["Raspbly"]+'&list='+settings[D].playlist+'&song='+settings[D].startSong,
				(err, res, body) => {
					request.get('http://localhost:7800/spotibly/shuffle?id='+devices["Raspbly"]);
					console.log(`(${res.statusCode})\n{${devices}}\n{${settings[D].playlist}\n${settings[D].startSong}}\n`);
				})
			});
		});
	}
});


function generateRandomString (length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

app.use(express.static(__dirname + '/public'))
	.use(cors())
	.use(cookieParser());

app.get("/spotibly/login", (req, res) => {
	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	res.redirect('https://accounts.spotify.com/authorize?' +
		qs.stringify({
			response_type: 'code',
			client_id: client.id,
			scope: scopes.join(" "),
			redirect_uri: client.uri,
			state: state
		})
	);
});

app.get("/spotibly/callback", (req, res) => {
	var {code, state} = req.query || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;
	if (state === null || state !== storedState) {
		res.redirect('/#' + qs.stringify({error: 'state_mismatch'}));
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: client.uri,
				grant_type: 'authorization_code'
		    	},
  		  	headers: {
    			'Authorization': 'Basic ' + (new Buffer(client.id + ':' + client.secret).toString('base64'))
  		  	},
  		  	json: true
		};
	    request.post(authOptions, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				var {access_token, refresh_token, expires_in, token_type} = body;
				tokens = {access_token, refresh_token, expires_in, token_type};
				fs.writeFileSync("/prgm/spotibly/tokens.json", JSON.stringify(tokens, null, "\t"));
				res.send(JSON.stringify(tokens, null, "\t"));
			} else {
				res.redirect('/#' +
				qs.stringify({
					error: 'invalid_token'
				}));
			}
		});
	}
});

app.get("/spotibly/refresh_token", (req, res) => {
	fs.readFile("/prgm/spotibly/tokens.json", (err, data) => {
		tokens = JSON.parse(data)
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			headers: { 'Authorization': 'Basic ' + (new Buffer(client.id + ':' + client.secret).toString('base64')) },
			form: {
				grant_type: 'refresh_token',
				refresh_token: tokens.refresh_token
			},
			json: true
		};
		console.log(authOptions)
		request.post(authOptions, (error, response, body) => {
    		if (!error && response.statusCode === 200) {
				var {access_token, token_type, expires_in} = body;
				var refresh_token = tokens.refresh_token;
				res.send(JSON.stringify(tokens, null, "\t"));
				console.log(JSON.stringify(tokens, null, "\t"));
				tokens = {access_token, refresh_token, token_type, expires_in};
				fs.writeFileSync('/prgm/spotibly/tokens.json', JSON.stringify(tokens, null, "\t"))
			}
		});
	});
});

function option (method, url, code, dataString, id) {
	if (!id) id = "";
	var option = {
		url: burl+url+id,
		method: method,
		headers: {
			'Accept' : 'application/json',
			'Content-Type' : 'application/json',
			'Authorization' : 'Bearer ' + code
		}
	}
	if (dataString) option.body = JSON.stringify(dataString, null, null);
	console.log(option);
	return option;
}

app.get('/spotibly/devices', (req, res) => {
	fs.readFile("/prgm/spotibly/tokens.json", (err, data) => {
		tokens = JSON.parse(data);
		request(option('GET', 'me/player/devices', tokens.access_token), (err, response, body) => {
			console.log(response.statusCode)
			var data = JSON.parse(body);
			if (response.statusCode == 200) {
				data.devices.forEach((e, i) => {
					devices[e.name] = e.id;
				});
				fs.writeFileSync("/prgm/spotibly/devices.json", JSON.stringify(devices, null, "\t"));
				res.send(JSON.stringify(devices, null, "\t"));
			}
		});
	});
});

app.get('/spotibly/play', (req, res) => {
	var {id, list, song} = req.query
	if (!song) song = "";
	fs.readFile("/prgm/spotibly/tokens.json", (err, data) => {
		tokens = JSON.parse(data)
		request(
			option('PUT', 'me/player/play?device_id=', tokens.access_token, {"context_uri" : list, "offset" : {"uri": song}}, id),
			(err, response, body) => {
				res.send(response.statusCode)
			}
		);
	});
});

app.get('/spotibly/next', (req, res) => {
	var {id} = req.query
	fs.readFile("/prgm/spotibly/tokens.json", (err, data) => {
		tokens = JSON.parse(data)
		request(
			option('POST', 'me/player/next?device_id=', tokens.access_token, null, id),
			(err, response, body) => {
				res.send(response.statusCode)
			}
		);
	})
});

app.get('/spotibly/nowplaying', (req, res) => {
	fs.readFile("./tokens.json", (err, data) => {
		tokens = JSON.parse(data);
		request(
			option('GET', 'me/player/currently-playing', tokens.access_token),
			(err, response, body) => {
				rep = JSON.parse(body);
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
						id:  rep.item.id,
					}
				}
				res.send(listening);
			}
		)
	})
});

app.get('/spotibly/shuffle', (req, res) => {
	var {id} = req.query
	fs.readFile("/prgm/spotibly/tokens.json", (err, data) => {
		tokens = JSON.parse(data)
		request(
			option('POST', 'me/player/shuffle?state=true&device_id=', tokens.access_token, null, id),
			(err, response, body) => {
				res.send(response.statusCode)
			}
		);
	})
});

app.listen(7800);
