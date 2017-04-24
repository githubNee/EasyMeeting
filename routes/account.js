var express = require('express');
var token_helper = require('../util/token.js');
var router = express.Router();
var request = require('request');
var underscore = require('underscore');
var user_model = require('../model/user_model');

router.route('/')
// 根据tokn获取用户信息 
.get(function(req, res, next) {
	var token = req.query.token;

	user_model.getInfo(token ,function (result) {
		if (result == null) 
			res.sendStatus(404);
		else
			res.send(result);
	});
})
// 用户注册
.post(function(req, res, next) {
	var user = user_model.create(req.body);
	if (user == null)
		res.sendStatus(400);

	else {
		var token = token_helper.create(user['email'], user['password']);
		user['token'] = token;

		user_model.check(user.email, function(result) {
			if(result == 1) {
				res.sendStatus(401);
			} else {
				user_model.insert(user, function(result) {
					res.sendStatus(201);
				});
			}
		});
	}

});

router.route('/exists')
// 检测邮箱是否被注册
.get(function(req, res, next) {
	var email = req.query.email;

	if (email == undefined) {
		res.sendStatus(400);
	}

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