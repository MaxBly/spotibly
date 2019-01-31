var socket = io.connect('http://192.168.1.92:7800');

var sel_minutes = document.querySelectorAll('.minutes');
var sel_hours = document.querySelectorAll('.hours');
var sel_playlist = document.querySelectorAll('.playlist');
var sel_startsong = document.querySelectorAll('.startsong');
var cb_enabled = document.querySelectorAll('.enabled');
var btn_save = document.querySelectorAll('.save');
var l_day = document.querySelectorAll('.day');
var p_job = document.getElementById('nextInvoc');
var settings;
var playlist;

[
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
].forEach((e, i) => {
    l_day[i].innerHTML = e;
})

socket.on('loggedin', () => {
    socket.emit('refresh_token');
    console.log('socket ok');
});

socket.on('token_ok', () => {
    socket.emit('getSettings');
    socket.emit('getNextInvoc');
});

socket.on('loadSettings', ({ settings, playlists }) => {
    console.log({ settings, playlists });
    settings.forEach((e, i) => {
        fillMinutes(sel_minutes[i], e);
        fillHours(sel_hours[i], e);
        fillPlaylists(sel_playlist[i], playlists, e.playlist);
        cb_enabled[i].checked = e.enabled;
    });
    console.log('loadSettings');
});

socket.on('loadTracks', ({ index, tracks, startSong }) => {
    console.log({ index, tracks, startSong });
    fillTracks(sel_startsong[index], tracks, startSong);
});

sel_playlist.forEach((e, index) => {
    e.addEventListener('change', () => {
        console.log('change')
        updateTracks(index);
    });
});

btn_save.forEach((e, index) => {
    e.addEventListener('click', () => {
        saveUpdate(index);
    });
});

document.getElementById('reload').addEventListener('click', () => {
    socket.emit('reload');
})


function fillHours(e, set) {
    for (let i = 0; i < 24; i++) {
        let opt = document.createElement('option')
        if (i == set.time[0]) opt.selected = true;
        opt.innerText = i;
        e.append(opt);
    }
}

function fillMinutes(e, set) {
    for (let i = 0; i < 60; i += 5) {
        let opt = document.createElement('option')
        if (i == set.time[1]) opt.selected = true;
        opt.innerText = i;
        e.append(opt);
    }
}

function fillPlaylists(e, playlists, sel) {
    playlists.forEach((list, i) => {
        let opt = document.createElement('option')
        opt.innerText = list[0];
        opt.id = list[1];
        if (sel == opt.id) opt.selected = true;
        e.append(opt);
    });
}

function fillTracks(e, tracks, sel) {
    tracks.forEach(track => {
        let opt = document.createElement('option')
        opt.innerText = `${track.artists[0].name} - ${track.name}`;
        opt.id = track.uri;
        if (sel == opt.id) opt.selected = true;
        e.append(opt);
    });
}

function updateTracks(index) {
    var opt = sel_playlist[index].options[sel_playlist[index].selectedIndex];
    let playlist = opt.id;
    let sel = "";
    sel_startsong[index].innerHTML = null;
    socket.emit('getTracks', ({ index, playlist, sel }))
    console.log({ index, playlist, sel })
}

function saveUpdate(index) {
    var enabled = cb_enabled[index].checked;
    var h = sel_hours[index].value;
    var m = sel_minutes[index].value;
    var playlist = sel_playlist[index].options[sel_playlist[index].selectedIndex].id;
    var startSong = sel_startsong[index].options[sel_startsong[index].selectedIndex].id;
    socket.emit('saveUpdate', ({ index, h, m, enabled, playlist, startSong }));
}

socket.on('loadNoJob', () => {
    p_job.innerHTML = 'no job';
});


socket.on('loadNextInvoc', ({ year, month, date, day, hours, minutes, seconds }) => {
    p_job.innerHTML = `${year}/${month + 1}/${date} ${day} ${hours}:${minutes}:${seconds}`;
});
