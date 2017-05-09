var express = require('express');
var app = express();
var server = require('http').createServer(app);
var SkyRTC = require('skyrtc').listen(server);
var path = require('path');
var port = process.env.PORT || 3000;
server.listen(port);
var request = require('request');
var bodyParser = require('body-parser');	
//var https = require('https');
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




options = {
        key: fs.readFileSync('./privatekey.pem'),
        cert: fs.readFileSync('./certificate.pem')
};
//https.createServer(options, app).listen(3001, function () {
        //console.log('Https server listening on port ' + 3001);
//});
app.get('/webrtc', function(req, res, next) {
        res.sendFile('public/test.html', {root: __dirname});
});



app.use((req,res,next)=>{
    res.send("404 not found");
})

