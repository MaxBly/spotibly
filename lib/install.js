var reader = require("read-console");
var fs = require('fs');

var default_settings = [
    {   /* Sunday */
        "enabled": false,
        "time": [11, 30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Monday */
        "enabled": true,
        "time": [6, 30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Tuesday */
        "enabled": true,
        "time": [7, 0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Wednesday */
        "enabled": true,
        "time": [11, 0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Thursday */
        "enabled": true,
        "time": [8, 0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Friday */
        "enabled": true,
        "time": [6, 30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Saturday */
        "enabled": true,
        "time": [11, 30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong": "<spotify_track_uri_within_the_playlist_or_album_above>"
    }
];


reader.read("your spotify client id: ", id => {
    reader.read("your spotify client secret: ", secret => {
        reader.read("your spotify redirect uri: ", uri => {
            fs.mkdir(__dirname + '/json', err => {
                if (err) throw err; else {
                    fs.writeFile(__dirname + "/json/client.json", JSON.stringify({ id, secret, uri }, null, "\t"), err => {
                        if (err) throw err; else {
                            reader.read("your spotify user name: ", owner => {
                                reader.read("your spotify connect device: ", device => {
                                    fs.writeFile(__dirname + "/json/user.json", JSON.stringify({ device, owner }, null, "\t"), err => {
                                        if (err) throw err; else {
                                            fs.writeFile(__dirname + "/json/tokens.json", "{}", err => {
                                                if (err) throw err; else {
                                                    fs.writeFile(__dirname + "/json/settings.json", JSON.stringify(default_settings, null, "\t"), err => {
                                                        if (err) throw err; else {
                                                            console.log("done");
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
    });
});