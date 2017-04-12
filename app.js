var express = require('express');
var app = express();

var path = require('path');
var request = require('request');
var bodyParser = require('body-parser');	

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


var account = require('./routes/account');
app.use('/api/account', account);

// app.get('/', function(req,res,next){
//     res.sendFile('public/welcome.html', { root: __dirname });
// });




app.use((req,res,next)=>{
    res.send("404 not found");
})

app.listen(3000);