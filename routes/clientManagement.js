/**
 * Created by ASUS on 2017/5/14.
 */
var express = require('express');
var router = express.Router();
var ips = {};
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}
router.route('/addIp')
    .post(function(req, res, next) {
        var ip = getClientIp(req);
        var name = req.body["name"];
        ips[ip] = name;
        console.log("新增ip:" + ip);
        res.send("新增用户:" + name + "对应ip:" + ip);
    });

router.route('/getOtherIps')
    .get(function(req, res, next) {
        var ip = getClientIp(req);
        var result = [];
        for(var k in ips) {
            if(k != ip) {
                result.push(
                    {
                        name:ips[k],
                        ip:k
                    }
                )
            }
        }
        res.send(result);
    });

module.exports = router;