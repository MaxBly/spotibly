# spotibly


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

}
```
this file will be filled automaticaly

__Create a devices.json file__
```json
{

}
```
this file will be filled automaticaly

```json
[
    {
        "enabled": false,
        "time":[11,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {
        "enabled": true,
        "time":[6,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {
        "enabled": true,
        "time":[7,0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {
        "enabled": true,
        "time":[11,0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {
        "enabled": true,
        "time":[8,0],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {
        "enabled": true,
        "time":[6,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    },
    {
        "enabled": true,
        "time":[11,30],
        "playlist": "<spotify_playlist_or_album_uri>",
        "startSong":"<spotify_track_uri_within_the_playlist_or_album_above>"
    }
]
```