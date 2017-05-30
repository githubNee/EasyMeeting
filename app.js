var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);

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
  next();
});


var account = require('./routes/account');
app.use('/api/user', account);

var session = require('./routes/session');
app.use('/api/session', session);

var account_info = require('./routes/account_info');
app.use('/api/userinfo', account_info);

var team = require('./routes/team');
app.use('/api/team', team);

var meeting = require('./routes/meeting');
app.use('/api/team', meeting);

var clientManagement = require('./routes/clientManagement');
app.use('/api/clientManagement', clientManagement);




options = {
        key: fs.readFileSync('./privatekey.pem'),
        cert: fs.readFileSync('./certificate.pem')
};
var sserver = https.createServer(options, app);
sserver.listen(3001, function () {
        console.log('Https server listening on port ' + 3001);
});
var io = require('socket.io').listen(sserver);
io.on('connection', function (socket) {
    console.log(socket.id + "connect");
    socket.on('upload_success', function (data) {
        io.emit("broadcast",data);
    });
    socket.on('disconnect', function () {
        io.emit('user disconnected',socket.id);
        console.log(socket.id + "disconnect");
    });
 });
var SkyRTC = require('skyrtc').listen(sserver);

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
 app.get('/webrtc', function(req, res, next) {
         res.sendFile('public/test.html', {root: __dirname});
 });
// app.get('/socketDemo', function(req, res, next) {
//     res.sendFile('public/socketTest.html', {root: __dirname});
// });
//
// app.get('/socketDemo2', function(req, res, next) {
//     res.sendFile('public/socketNew.html', {root: __dirname});
// });


var sessions = {};
var usersInSessionLimit = 3;

var rtcport = process.env.PORT || 4000;

if (process.argv.length >= 3) {
    rtcport = process.argv[2];
}

var serverDir = path.dirname(__filename);
var clientDir = path.join(serverDir, "client/");

var contentTypeMap = {
    ".html": "text/html;charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css"
};

function requestListener(request, response) {
    var headers = {
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
        "Expires": "0"
    };

    var parts = request.url.split("/");
    // handle "client to server" and "server to client"
    if (parts[1] == "ctos" || parts[1] == "stoc") {
        var sessionId = parts[2];
        var userId = parts[3];
        if (!sessionId || !userId) {
            response.writeHead(400);
            response.end();
            return;
        }

        if (parts[1] == "stoc") {
            console.log("@" + sessionId + " - " + userId + " joined.");

            headers["Content-Type"] = "text/event-stream";
            response.writeHead(200, headers);
            function keepAlive(resp) {
                resp.write(":\n");
                resp.keepAliveTimer = setTimeout(arguments.callee, 30000, resp);
            }
            keepAlive(response);  // flush headers + keep-alive

            var session = sessions[sessionId];
            if (!session)
                session = sessions[sessionId] = {"users" : {}};

            if (Object.keys(session.users).length > usersInSessionLimit - 1) {
                console.log("user limit for session reached (" + usersInSessionLimit + ")");
                response.write("event:busy\ndata:" + sessionId + "\n\n");
                clearTimeout(response.keepAliveTimer);
                response.end();
                return;
            }

            var user = session.users[userId];
            if (!user) {
                user = session.users[userId] = {};
                for (var pname in session.users) {
                    var esResp = session.users[pname].esResponse;
                    if (esResp) {
                        clearTimeout(esResp.keepAliveTimer);
                        keepAlive(esResp);
                        esResp.write("event:join\ndata:" + userId + "\n\n");
                        response.write("event:join\ndata:" + pname + "\n\n");
                    }
                }
            }
            else if (user.esResponse) {
                user.esResponse.end();
                clearTimeout(user.esResponse.keepAliveTimer);
                user.esResponse = null;
            }
            user.esResponse = response;

            request.on("close", function () {
                for (var pname in session.users) {
                    if (pname == userId)
                        continue;
                    var esResp = session.users[pname].esResponse;
                    esResp.write("event:leave\ndata:" + userId + "\n\n");
                }
                delete session.users[userId];
                clearTimeout(response.keepAliveTimer);
                console.log("@" + sessionId + " - " + userId + " left.");
                console.log("users in session " + sessionId + ": " + Object.keys(session.users).length);
            });

        } else { // parts[1] == "ctos"
            var peerId = parts[4];
            var peer;
            var session = sessions[sessionId];
            if (!session || !(peer = session.users[peerId])) {
                response.writeHead(400, headers);
                response.end();
                return;
            }

            var body = "";
            request.on("data", function (data) { body += data; });
            request.on("end", function () {
                console.log("@" + sessionId + " - " + userId + " => " + peerId + " :");
                // console.log(body);
                var evtdata = "data:" + body.replace(/\n/g, "\ndata:") + "\n";
                peer.esResponse.write("event:user-" + userId + "\n" + evtdata + "\n");
            });

            // to avoid "no element found" warning in Firefox (bug 521301)
            headers["Content-Type"] = "text/plain";
            response.writeHead(204, headers);
            response.end();
        }

        return;
    }
}

app.use('/openwebrtc',requestListener);
app.get('/test', function(req, res, next) {
    res.sendFile('public/client/webrtc_example.html', {root: __dirname});
});

app.use((req,res,next)=>{
    res.send("404 not found");
})

