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

app.use(fileUpload());
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: '23x8c8v0x9886w' }));
app.use(express.static('frontend'));

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

/*
addEvent(new Event({
    lat: 29.42401921083364,
    long: -98.50282983580581,
    user: 'edrftgyh',
    type: 'RESOURCE',
    title: 'Available Water Bottles',
    description: 'Clean Drinking water bottles available for distribution.',
    mediaIDS: ['29x8ss'],
    date: new Date()
}));



db.users.push({
    userId: '29x8s0',
    pass: 'jask98d8s',
    phoneNumber: '9562469297'
});

*/

/*
app.get('/', function (req, res) {
    if (req.session.page_views) {
        req.session.page_views++;
        res.send('You visited this page ' + req.session.page_views + ' times');
    } else {     
        req.session.page_views = 1;
        res.send('Welcome to this page for the first time!');
    }
});
*/

app.get('/', (req, res) => {
    sendPage(res, 'index.html');
});

app.get('/signup', (req, res) => {
    sendPage(res, 'signup.html');
});

app.get('/home', (req, res) => {
    sendPage(res, 'home.html');
});

app.get('/post', (req, res) => {
    sendPage(res, 'post.html');
});

app.post('/upload', async (req, res) => {
    console.log('upload')
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
        console.log('alrady had long and lat :D')
        address = streetAddress + ', ' + city + ', ' + state + ' ' + zip;
    }

    addEvent(new Event({
        lat,
        long,
        user: 'edrftgyh',
        type,
        title: name,
        description,
        mediaIDS: mediaIDS,
        address,
        mediaURLS,
        date: new Date()
    }));


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
    })
});

server.listen(3000);