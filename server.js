const http = require('http');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const shortid = require('shortid');
const app = express();
const fileUpload = require('express-fileupload');
const fs = require('fs');
const fetch = require("node-fetch");
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('rowdyhacks');
const server = http.createServer(app);
const io = require('socket.io')(server);
const crypto = require('crypto');


const saltRounds = 10;

app.use(fileUpload());
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: '23x8c8v0x9886w' }));
app.use(express.static('frontend'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend', 'views'));

const pagesDir = path.join(__dirname, 'frontend', 'pages');

const sendPage = (res, pageFile) => {
    res.sendFile(path.join(pagesDir, pageFile));
};

const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));

const getData = async url => {
    try {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    } catch (error) {
        console.log(error);
    }
};



const dateFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
function User(data) {
    this.userId = data.userId || shortid.generate();
    this.phoneNumber = data.phoneNumber;
    this.pass = data.pass;
}
function Event(data) {
    this.eventId = data.eventId || shortid.generate();
    this.lat = data.lat;
    this.long = data.long;
    this.user = data.user;
    this.type = data.type; // INFO, RESOURCE, EMERGENCY
    this.title = data.title;
    this.description = data.description;
    this.mediaIDS = data.mediaIDS;
    this.mediaCount = data.mediaIDS.length;
    this.date = data.date;
    this.dateFormatted = data.date.toLocaleDateString('en-US', dateFormatOptions);
    this.address = data.address;
    this.mediaURLS = data.mediaURLS;
}

const saveDB = () => {
    fs.writeFile('./db.json', JSON.stringify(db, null, 4), () => {

    });
}
const addEvent = async (event) => {
    db.events.push(event);
    io.emit('event', event);
    saveDB();
}

app.get('/', (req, res) => {
    //sendPage(res, 'index.html');
    res.redirect('/home');
});

app.get('/signup', (req, res) => {
    sendPage(res, 'signup.html');
});



app.get('/login', (req, res) => {
    if (session.uId)
        res.redirect('/home');
    else
        sendPage(res, 'signin.html');
});

app.get('/signin', (req, res) => {
    sendPage(res, 'signin.html');
});

app.get('/signout', (req, res) => {
    delete session.uId;
    res.redirect('/home');
});

app.get('/postlist', (req, res) => {
    if (!session.uId)
        res.redirect('/home');
    else {
        const events = db.events.filter(e => e.user === session.uId);
        const s = (o, t) => {
            return new Date(t.date) - new Date(o.date);
        }
        res.render('postlist', {
            userId: session.uid,
            events: events.sort(s)
        });
    }

});

app.get('/home', function (req, res) {
    res.render('home', {
        isLoggedIn: session.uId
    });
});

app.get('/post', (req, res) => {
    if (!session.uId)
        res.redirect('/home');
    else
        res.render('post', {
            isLoggedIn: session.uId
        });
});

app.get('/update/:postId', (req, res) => {
    if (!session.uId)
        res.redirect('/home');
    else {
        const userId = session.uId;
        const postId = req.params.postId;
        const post = db.events.filter(event => { return event.eventId === postId; });
        if (post.length === 0 || post[0].user !== userId)
            res.redirect('/home');
        else
            res.render('update', {
                event: post[0]
            });
    }
});

app.get('/session/:userId', function (req, res) {
    const userId = req.params.userId;
    for (i in db.users)
        if (db.users[i].userId === userId)
            session.uId = userId;
    res.redirect('/home');
});

app.post('/upload', async (req, res) => {
    const event = JSON.parse(req.body.event);
    const filesObj = req.files;
    const files = [];
    const mediaIDS = [], mediaURLS = [];
    console.log(filesObj);
    for (i in filesObj)
        files.push(filesObj[i]);
    let {
        name,
        type,
        description,
        country,
        state,
        city,
        zip,
        userId,
        long,
        lat
    } = event;
    console.log(event);
    let streetAddress = event.address;
    res.send("Success");

    await Promise.all(files.map(async (file) => {
        console.log('processing', file);
        const promise = new Promise((res, rej) => {
            const type = file.mimetype.indexOf('image') > -1 ? 'img' : 'vid';
            const id = type + '_' + shortid.generate();
            const ext = file.name.substring(file.name.lastIndexOf('.'));
            mediaIDS.push(id + ext);
            const gFile = bucket.file(id + ext);
            const wStream = gFile.createWriteStream();
            wStream.on('error', rej)
                .on('finish', async () => {
                    try {
                        await gFile.makePublic();
                        mediaURLS.push(gFile.publicUrl());
                        res();
                    }
                    catch (e) { rej(e); }
                });
            wStream.write(file.data);
            wStream.end();
        });
        await promise;
    }));
    const replaceSpaces = (str) => {
        return str.trim().replace(/\s+/g, '+');
    }
    let address;
    if (!long && !lat) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${replaceSpaces(streetAddress)},${replaceSpaces(city)},${state},${country}&key=AIzaSyDJXLxcAB-ZWpwwVbAK6K5bZTvWzcfn7OY`;
        const response = await getData(url);
        const body = response.results[0];
        address = body.formatted_address.substring(0, body.formatted_address.lastIndexOf(','));
        const results = body.geometry.location;
        long = results.lng;
        lat = results.lat;
    }
    else {
        address = streetAddress + ', ' + city + ', ' + state + ' ' + zip;
    }

    addEvent(new Event({
        lat,
        long,
        user: userId,
        type,
        title: name,
        description,
        mediaIDS: mediaIDS,
        address,
        mediaURLS,
        date: new Date()
    }));


});
app.post('/update', async (req, res) => {
    const event = JSON.parse(req.body.event);
    let found = false;
    for (i = 0; !found && i < db.events.length; i++) {
        const _event = db.events[i];
        if (_event.eventId === event.postId) {
            const replaceSpaces = (str) => {
                return str.trim().replace(/\s+/g, '+');
            }
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${replaceSpaces(event.address)},${replaceSpaces(event.city)},${event.state},${event.country}&key=AIzaSyDJXLxcAB-ZWpwwVbAK6K5bZTvWzcfn7OY`;
            const response = await getData(url);
            const body = response.results[0];
            const address = body.formatted_address.substring(0, body.formatted_address.lastIndexOf(','));
            const results = body.geometry.location;
            const long = results.lng;
            const lat = results.lat;

            const newEvent = { ..._event };
            newEvent.lat = lat;
            newEvent.long = long;
            newEvent.type = event.type;
            newEvent.title = event.name;
            newEvent.description = event.description;
            newEvent.address = address;

            db.events[i] = newEvent;
            found = true;

        }
    }
    if (found)
        saveDB();
    res.send("Success");
});
io.on('connection', (socket) => {
    socket.emit('events', db.events);
    socket.on('geolocate', async (coords, callback) => {

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.long}&key=AIzaSyDJXLxcAB-ZWpwwVbAK6K5bZTvWzcfn7OY`;
        const response = await getData(url);
        const body = response.results[0].address_components;
        const street = body[0].long_name + ' ' + body[1].long_name;
        const city = body[2].long_name;
        const state = body[4].short_name;
        const country = body[5].long_name;
        const zip = body[6].long_name;

        const results = response.results[0].geometry.location;
        const long = results.lng;
        const lat = results.lat;

        callback({
            street,
            city,
            state,
            zip,
            long,
            lat,
            country
        });
    });

    socket.on('register', (user, callback) => {
        const phoneNumber = user.phoneNumber.replace(/\W/g, '');
        let found = false;
        for (i in db.users) {
            const u = db.users[i];
            if (!found && u.phoneNumber === phoneNumber)
                found = true;
        }
        if (found)
            callback('Phone number is already in use');
        else {
            const hash = crypto.createHash('md5').update(user.password).digest("hex");
            const userId = shortid.generate()
            db.users.push({
                userId: userId,
                pass: hash,
                phoneNumber
            });
            saveDB();
            callback(null, '/session/' + userId);
        }
    });
    socket.on('signin', (user, callback) => {
        const phoneNumber = user.phoneNumber.replace(/\W/g, '');
        let found = false;
        const hash = crypto.createHash('md5').update(user.pass).digest("hex");
        for (let i = 0; !found && i < db.users.length; i++) {
            const _user = db.users[i];
            if (phoneNumber === _user.phoneNumber)
                if (hash === _user.pass) {
                    found = true;
                    callback('/session/' + _user.userId);
                }
        }
        if (!found)
            callback(false);
    });

    socket.on('delete', (postId) => {
        for (i = 0; i < db.events.length; i++) {
            if (db.events[i].eventId === postId) {
                db.events.splice(i, 1);
            }
        }
        saveDB();
    });
});

server.listen(3000);