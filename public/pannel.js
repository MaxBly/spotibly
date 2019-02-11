const socket = io.connect('http://192.168.1.92:7800');

const sel_minutes = document.querySelectorAll('.minutes');
const sel_hours = document.querySelectorAll('.hours');
const sel_playlist = document.querySelectorAll('.playlist');
const sel_startsong = document.querySelectorAll('.startsong');
const cb_enabled = document.querySelectorAll('.enabled');
const btn_save = document.querySelectorAll('.save');
const l_day = document.querySelectorAll('.day');
const p_job = document.querySelectorAll('.next');

const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

days.forEach((e, i) => {
    l_day[i].innerHTML = e;
})

socket.on('loggedin', () => {
    socket.emit('refresh_token');
    console.log('socket ok');
});

socket.on('token_ok', () => {
    socket.emit('getSettings');
});

socket.on('loadSettings', ({ settings, playlists }) => {
    console.log({ settings, playlists });
    settings.forEach((e, i) => {
        fillMinutes(sel_minutes[i], e);
        fillHours(sel_hours[i], e);
        fillPlaylists(sel_playlist[i], playlists, e.playlist);
        cb_enabled[i].checked = e.enabled;
        socket.emit('getNextInvoc', i);
    });
    console.log('loadSettings');
});

socket.on('loadTracks', ({ index, tracks, startSong }) => {
    console.log({ index, tracks, startSong });
    fillTracks(sel_startsong[index], tracks, startSong);
});

socket.on('relaodOk', day => {
    console.log('reloadOk', day);
    socket.emit('getNextInvoc', day);
});

socket.on('loadNoJob', i => {
    p_job[i].innerHTML = 'no job';
});


socket.on('loadNextInvoc', ({ i, data }) => {
    console.log('loadNextInvoc', { i, data });
    let { year, month, date, day, hours, minutes } = data;
    p_job[i].innerHTML = `${year}/${month + 1}/${date} ${days[day]} ${hours}:${minutes}`;
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

function fillHours(e, set) {
    e.innerHTML = "";
    for (let i = 0; i < 24; i++) {
        let opt = document.createElement('option');
        if (i == set.time[0]) opt.selected = true;
        opt.innerText = i;
        e.append(opt);
    }
}

function fillMinutes(e, set) {
    e.innerHTML = "";
    for (let i = 0; i < 60; i += 5) {
        let opt = document.createElement('option');
        if (i == set.time[1]) opt.selected = true;
        opt.innerText = i;
        e.append(opt);
    }
}

function fillPlaylists(e, playlists, sel) {
    e.innerHTML = "";
    playlists.forEach((list, i) => {
        let opt = document.createElement('option');
        opt.innerText = list[0];
        opt.id = list[1];
        if (sel == opt.id) opt.selected = true;
        e.append(opt);
    });
}

function fillTracks(e, tracks, sel) {
    e.innerHTML = "";
    tracks.forEach(track => {
        let opt = document.createElement('option');
        opt.innerText = `${track.artists[0].name} - ${track.name}`;
        opt.id = track.uri;
        if (sel == opt.id) opt.selected = true;
        e.append(opt);
    });
}

function updateTracks(index) {
    let opt = sel_playlist[index].options[sel_playlist[index].selectedIndex];
    let playlist = opt.id;
    let sel = "";
    sel_startsong[index].innerHTML = null;
    socket.emit('getTracks', ({ index, playlist, sel }))
    console.log({ index, playlist, sel })
}

function saveUpdate(index) {
    let enabled = cb_enabled[index].checked;
    let h = sel_hours[index].value;
    let m = sel_minutes[index].value;
    let playlist = sel_playlist[index].options[sel_playlist[index].selectedIndex].id;
    let startSong = sel_startsong[index].options[sel_startsong[index].selectedIndex].id;
    socket.emit('saveUpdate', ({ index, h, m, enabled, playlist, startSong }));
}
