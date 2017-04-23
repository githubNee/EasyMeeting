var express = require('express');
var router = express.Router();
var request = require('request');
var underscore = require('underscore');
var user_model = require('../model/user_model');

router.router('/')
// 用户注册
.post(function(req, res, next) {
	var user = user_model.create(req.body);

	
});

router.route('/exists')
// 检测邮箱是否被注册
.get(function(req, res, next) {
	var email = req.query.email;

	user_model.check(email, function(result) {
		if(result == 1) {
			res.sendStatus(200);
		} else if (result == 0){
			res.sendStatus(404);
		} else {
			res.sendStatus(500);
		}
	});
});


module.exports = router;