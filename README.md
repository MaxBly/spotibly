# spotibly

This is a wake up spotify based project.
I have installed **Raspotify** on my raspberry pi.
This app will launch spotify a time a day if enabled, checkout the settings file bellow.
You'll need to launch this deamon a reboot at 00:00

`npm i` to install dependencies, this will ask you your spotify app ids (`client_id`, `client_secret` and `redirect_uri`) and
this app needs also your `spotify username` and your `spotify playback device app name`

Then you can goto http://localhost:7800/ to connect your spotify account
Then you can goto http://localhost:7800/spotibly/settings/pannel to configure settings