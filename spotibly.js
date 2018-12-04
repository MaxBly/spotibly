var request = require ("request");
var express = require ("express");
var qs = require("querystring");
var fs =require("fs");
var app = express();

var burl = "https://api.spotify.com/v1/"

function option (method, url, dataString, id) {
	if (!id) id = "";
	var option = {
		url: burl+url+id,
		method: method,
		headers: {
			'Accept' : 'application/json',
			'Content-Type' : 'application/json',
			'Authorization' : 'Bearer ' + getCode()
		}
	}
	if (dataString) option.body = JSON.stringify(dataString, null, null);
	console.log(option);
	return option;
}
function getCode() {
	fs.readFile("tokens.json", (err, data) => {
		tokens = JSON.parse(data);
		var opt = {
			method: 'POST',
			url: 'https://accounts.spotify.com/api/token',
			headers: {
			'Authorization' : 'Basic ' + (new Buffer(tokens.id+':'+tokens.secret).toString('base64'))
		},
		form: {
			grant_type: 'client_credentials'
		},
		json: true
	}
	request(opt, (err, res, body) => {
		if(!err && res.statusCode === 200) {
			tokens.token = body.access_token;
			fs.writeFileSync("tokens.json", JSON.stringify(tokens))
			return tokens.token;
		}
	})
	})
}
function callback (err, res, body) {
	if (err) console.log(err);
	console.log(body);
}
/* 
app.get('/spotibly/callback', (req, res) => {
	res.send(req.query)
	fs.writeFileSync("stokens.json", JSON.stringify(req.query, null, "\t"));
	res.redirect("/")
}); */


app.get('/spotibly/devices', (req, res) => {
	request(option('GET', 'me/player/devices'), callback)
})

app.get('/spotibly/play', (req, res) => {
	var {id, uri} = req.query
	request(option('PUT', 'me/player/play?device_id=', {"context_uri" : uri, "position_ms" : 0}, id), callback);
});


















app.listen(7800);
