#!/usr/sbin/node
var request = require ("request");
var express = require ("express");
var qs = require("querystring");
var cors = require("cors");
var schedule = require("node-schedule");
var cookieParser = require("cookie-parser");
var fs = require("fs");
var app = express();
var path = "/prgm/spotibly/";
var client = require(path + "client.json");
var settings = require(path + "settings.json");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var date = new Date(), D = date.getDay();

var burl = "https://api.spotify.com/v1/",
	tokens, devices = {}, stateKey = 'spotify_auth_state',
	device = "Raspbly",
	scopes = [
		'user-read-playback-state',
		'user-modify-playback-state',
		'user-read-currently-playing',
		'user-read-private',
		'playlist-read-collaborative',
		'playlist-read-private',
		'user-read-email'
	];


var j = schedule.scheduleJob(`${settings[D].time[1]} ${settings[D].time[0]} * * *`, () => {
	console.log(`[${D}][${settings[D].time[0]}h${settings[D].time[0]}](${settings[D].enabled})`);
	if (settings[D].enabled) {
		request.get('http://localhost:7800/spotibly/refresh_token', () => {
			request.get('http://localhost:7800/spotibly/devices', (e, r, dev) => {
				devices = JSON.parse(dev);
				request.get('http://localhost:7777/cmd/s/vu/0.1.0.1-0-1.1-0-1.1-0-1.1-0-1');
				request.get('http://localhost:7800/spotibly/play?id='+devices[device]+'&list='+settings[D].playlist+'&song='+settings[D].startSong,
				(err, res, body) => {
					request.get('http://localhost:7800/spotibly/shuffle?id='+devices[device]);
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

app.use(express.static(path + 'public'))
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
				var {access_token, refresh_token} = body;
				tokens = {access_token, refresh_token};
				fs.writeFileSync(path + "tokens.json", JSON.stringify(tokens, null, "\t"));
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
	fs.readFile(path + "tokens.json", (err, data) => {
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
				var {access_token} = body;
				var refresh_token = tokens.refresh_token;
				res.send(JSON.stringify(tokens, null, "\t"));
				console.log(JSON.stringify(tokens, null, "\t"));
				tokens = {access_token, refresh_token};
				fs.writeFileSync(path + 'tokens.json', JSON.stringify(tokens, null, "\t"))
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
	fs.readFile(path + "tokens.json", (err, data) => {
		tokens = JSON.parse(data);
		request(option('GET', 'me/player/devices', tokens.access_token), (err, response, body) => {
			console.log(response.statusCode)
			var data = JSON.parse(body);
			if (response.statusCode == 200) {
				data.devices.forEach((e, i) => {
					devices[e.name] = e.id;
				});
				fs.writeFileSync(path + "devices.json", JSON.stringify(devices, null, "\t"));
				res.send(JSON.stringify(devices, null, "\t"));
			}
		});
	});
});

app.get('/spotibly/play', (req, res) => {
	var {id, list, song} = req.query
	if (!song) song = "";
	fs.readFile(path + "tokens.json", (err, data) => {
		tokens = JSON.parse(data)
		request(
			option('PUT', 'me/player/play?device_id=', tokens.access_token, {"context_uri" : list, "offset" : (song) ? {"uri": song} : {}}, id),
			(err, response, body) => {
				res.send(response.statusCode)
			}
		);
	});
});

app.get('/spotibly/next', (req, res) => {
	var {id} = req.query
	fs.readFile(path + "tokens.json", (err, data) => {
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
	fs.readFile(path + "tokens.json", (err, data) => {
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
	fs.readFile(path + "tokens.json", (err, data) => {
		tokens = JSON.parse(data)
		request(
			option('POST', 'me/player/shuffle?state=true&device_id=', tokens.access_token, null, id),
			(err, response, body) => {
				res.send(response.statusCode)
			}
		);
	})
});

app.get('/spotibly/playlist',  (req, res) => {
	fs.readFile(path + 'tokens.json', (err, data) => {
		tokens = JSON.parse(data);
		request(
			option('GET', 'me/playlists?limit=50', tokens.access_token), (err, response, body) => {
				var results = {playlists: []};
				var playlists = JSON.parse(body);
				playlists.items.forEach((e,i) => {
					if (e.owner.display_name == "max_bly")
					results.playlists.push([e.name, e.uri]);
				})
				results.next = playlists.next;
				res.send(JSON.stringify(results, null, "\t"));
				//res.send(body);

			}
		)
	});
});
app.get('/spotibly/tracks',  (req, res) => {
	var {id} = req.query;
	fs.readFile(path + 'tokens.json', (err, data) => {
		tokens = JSON.parse(data);
		request(
			option('GET', 'playlists/' + id + '/tracks', tokens.access_token), (err, response, body) => {
				var results = {tracks: []};
				var tracks = JSON.parse(body);
				tracks.items.forEach((e,i) => {
					results.tracks[i] = {name: e.track.name, uri: e.track.uri, artists: [], album: e.track.album.name};
					e.track.album.artists.forEach(el => {results.tracks[i].artists.push({name: el.name, uri: el.uri})})
				})
				results.next = tracks.next;
				res.send(JSON.stringify(results, null, "\t"));
				//res.send(body);

			}
		)
	});
});
app.get("spotibly/settings", (req, res) => {
	res.render("")
});
app.post("/spotibly/settings/update", urlencodedParser, (req, res) => {
	var {day, h, m, enabled, list, song} = req.body;
	fs.readFile(path + "tokens.json", (err, data) => {
		tokens = JSON.parse(data);
		tokens[day] = {
			time: [h,m],
			enabled: enabled,
			list: list,
			song: song
		};
		fs.writeFileSync(path + 'tokens.json', tokens);
	});
})


app.listen(7800);
