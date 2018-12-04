var request = require ("request");
var express = require ("express");
var qs = require("querystring");
var fs =require("fs");
var app = express();

var burl = "https://api.spotify.com/v1/"

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
	return option;
}

function callback (err, response, body) {
	if (err) console.log(err);
	console.log(body);
}

app.get('/spotibly/callback', (req, res) => {
	res.send(req.query)
	fs.writeFileSync("stokens.json", JSON.stringify(req.query, null, "\t"));
});


app.get('/spotibly/devices', (req, res) => {
	fs.readFile("stokens.json", (err, data) => {
		var {code} = JSON.parse(data);
		request(option('GET', 'me/player/devices', code), callback)
	})
})

app.get('/spotibly/play', (req, res) => {
	fs.readFile("stokens.json", (err, data) => {
		var {id, uri} = req.query
		var {code} = JSON.parse(data);
		request(option('PUT', 'me/player/play?device_id=',  code, {"context_uri" : uri, "position_ms" : 0}, id), callback);
	});
});


















app.listen(7800);
