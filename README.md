# spotibly

This is a wake up spotify based project.
I have installed **Raspotify** on my raspberry pi.
This app will launch spotify a time a day if enabled, checkout the settings file bellow.
You'll need to create 3 json files and edit that spotibly.js file too, to use this app.

__Edit spotibly.js__
```js
var path = "/prgm/spotibly/", 	//your own spotibly path
    device = "Raspbly",			//your own spotify device to play
    owner = "max_bly";			//yout own spotify user name
```

__Create a client.json file__
```json
{
	"id":"<your_spotify_client_id>",
	"secret":"<your_spotify_client_secret>",
	"uri":"<your_spotify_redirect_uri>"
}
```
__Create a tokens.json file__
```json
{
    /* this file will be filled automaticaly */
}
```

__Create a settings.json file__
```json
[
    {   /* Sunday */
        "enabled": false,
        "time":[11,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Monday */
        "enabled": true,
        "time":[6,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Tuesday */
        "enabled": true,
        "time":[7,0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Wednesday */
        "enabled": true,
        "time":[11,0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Thursday */
        "enabled": true,
        "time":[8,0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Friday */
        "enabled": true,
        "time":[6,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {   /* Saturday */
        "enabled": true,
        "time":[11,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    }
]
```

Then you can goto http://localhost:7800/spotibly/login to connect your spotify account
then you can edit settings on http://localhost:7800/spotibly/settings