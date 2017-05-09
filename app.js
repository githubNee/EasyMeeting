var express = require('express');
var app = express();
var server = require('http').createServer(app);
var SkyRTC = require('skyrtc').listen(server);
var path = require('path');
var port = process.env.PORT || 3000;
server.listen(port);
var request = require('request');
var bodyParser = require('body-parser');	
var https = require('https');
var fs = require('fs');


// 跨域访问
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , PRIVATE-TOKEN');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  else {
    next();
  }
});


var account = require('./routes/account');
app.use('/api/user', account);

var session = require('./routes/session');
app.use('/api/session', session);

var account_info = require('./routes/account_info');
app.use('/api/userinfo', account_info);

var team = require('./routes/team');
app.use('/api/team', team);




options = {
        key: fs.readFileSync('./privatekey.pem'),
        cert: fs.readFileSync('./certificate.pem')
};
https.createServer(options, app).listen(3001, function () {
        console.log('Https server listening on port ' + 3001);
});
app.get('/webrtc', function(req, res, next) {
        res.sendFile('public/test.html', {root: __dirname});
});



app.use((req,res,next)=>{
    res.send("404 not found");
})

SkyRTC.rtc.on('new_connect', function(socket) {
    console.log('创建新连接');
});

SkyRTC.rtc.on('remove_peer', function(socketId) {
    console.log(socketId + "用户离开");
});

SkyRTC.rtc.on('new_peer', function(socket, room) {
    console.log("新用户" + socket.id + "加入房间" + room);
});

SkyRTC.rtc.on('socket_message', function(socket, msg) {
    console.log("接收到来自" + socket.id + "的新消息：" + msg);
});

SkyRTC.rtc.on('ice_candidate', function(socket, ice_candidate) {
    console.log("接收到来自" + socket.id + "的ICE Candidate");
});

SkyRTC.rtc.on('offer', function(socket, offer) {
    console.log("接收到来自" + socket.id + "的Offer");
});

SkyRTC.rtc.on('answer', function(socket, answer) {
    console.log("接收到来自" + socket.id + "的Answer");
});

SkyRTC.rtc.on('error', function(error) {
    console.log("发生错误：" + error.message);
});
