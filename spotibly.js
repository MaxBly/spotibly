var request = require ("request");
var express = require ("express");
var qs = require("querystring");
var fs =require("fs");
var app = express();

var burl = "https://api.spotify.com/v1"

app.get('/spotibly/callback', (req, res) => {
	res.send(req.query)
	fs.writeFileSync("stokens.json", JSON.stringify(req.query, null, "\t"));	
});


app.get('/spotibly/play', (req, res) => {
	fs.readFile("stokens.json", (err, data) => {
		var {id, uri} = req.query
		var {code} = JSON.parse(data);
		var headers = {
			'Accept' : 'application/json',
			'Content-Type' : 'application/json',
			'Authorization' : 'Bearer ' + code
		}
		var dataString = {
			"context_uri" : uri,
			"position_ms" : 0
		}
		var option = {
			url: burl+'/me/player/play?device_id='+id,
			method: 'PUT',
			headers: headers,
			body: JSON.stringify(dataString, null, null)
		}
		
	});
});


















app.listen(7800);
