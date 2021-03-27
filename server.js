const http = require('http');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const shortid = require('shortid');
const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(cookieParser());
app.use(session({ secret: '23x8c8v0x9886w' }));
app.use(express.static('frontend'));

const pagesDir = path.join(__dirname, 'frontend', 'pages');

const sendPage = (res, pageFile) => {
    res.sendFile(path.join(pagesDir, pageFile));
};

const db = {
    users: [],
    events: []
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
}

const addEvent = async (event) => {
    event.mediaURLS = [];
    for (i in event.mediaIDS) {
        const mediaURL = await mediaIDToURL(event.mediaIDS[i]);
        event.mediaURLS.push(mediaURL);
    }
    db.events.push(event);
    io.emit('event', event);
}

const mediaIDToURL = (mediaID) => {
    return new Promise((resolve, reject) => {
        let url = 'NOPE';
        if (mediaID === '29x8ss') {
            url = 'https://whatsnewlaporte.com/wp-content/uploads/2016/01/IMG_0022.jpg';
        }
        else if (mediaID === '298dssd') {
            url = 'https://www.ksat.com/resizer/Rsy9sH-HbK13qfyM1mbvsdPCII8=/1280x720/smart/filters:format(jpeg):strip_exif(true):strip_icc(true):no_upscale(true):quality(65)/cloudfront-us-east-1.images.arcpublishing.com/gmg/C3LVNECVTFA5ZM5FOE3OTAURH4.png';
        }
        else if (mediaID === 'sjskdn') {
            url = 'https://static01.nyt.com/images/2020/01/18/reader-center/18xp-weather/merlin_167291904_1088632b-57d3-40d1-8988-cd05d3333870-superJumbo.jpg';
        }
        resolve(url);
    });
}
addEvent(new Event({
    lat: 29.425170742301603,
    long: -98.49477365422787,
    user: '29x8s0',
    type: 'INFO',
    title: 'Heavy Snow',
    description: 'Heavy snow on intersection',
    mediaIDS: ['sjskdn'],
    date: new Date()
}));

setTimeout(() => {
    addEvent(new Event({
        lat: 29.425170742301603,
        long: -98.59477365422787,
        user: '29x8s0',
        type: 'INFO',
        title: 'Heavy Snow',
        description: 'Heavy snow on intersection',
        mediaIDS: ['sjskdn'],
        date: new Date()
    }));
    
}, 10000)


addEvent(new Event({
    lat: 29.425137703455654,
    long: -98.49660577769659,
    user: '29x8s0',
    type: 'EMERGENCY',
    title: 'Car Crash',
    description: 'Car Crash, drivers inacessible with nearby snow',
    mediaIDS: ['298dssd'],
    date: new Date()
}));

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

db.users.push({
    userId: 'edrftgyh',
    pass: 'zsxdcfvgb',
    phoneNumber: '2104787188'
});

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


io.on('connection', (socket) => {
    socket.emit('events', db.events);
});

server.listen(3000);