var express = require('express');
var token_helper = require('../util/token.js');
var router = express.Router();
var request = require('request');
var underscore = require('underscore');
var user_model = require('../model/user_model');
var meeting_model = require('../model/meeting_model');

router.route('/')
// 根据tokn获取用户信息 
.get(function(req, res, next) {
	var token = req.query.token;

	user_model.getInfo(token ,function (result) {
		if (result == null) 
			res.sendStatus(404);
		else {
			res.send(result);
		}
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
			if(result != null) {
				res.sendStatus(401);
			} else {
				user_model.insert(user, function(result) {
					res.sendStatus(201);
				});
			}
		});
	}

})
// 更新用户
.put(function(req, res, next) {
	if (req.body['token'] == undefined || req.body['email'] == undefined || req.body['password'] == undefined || req.body['oldPassword'] == undefined)
		res.sendStatus(400);
	else {
		user_model.getInfo(req.body['token'], function(result) {
			if (result == null) 
				res.sendStatus(404);
			else {
				user_model.checkPassword(req.body['token'], req.body['oldPassword'], function(result) {
					if (result == 1) 
						user_model.checkByToken(req.body['email'], req.body['token'], function(result) {
							if (result == 1)
								res.sendStatus(403);
							else {
								var token = token_helper.create(req.body['email'], req.body['password']);
								user_model.updateUser(req.body['email'], req.body['password'], token, req.body['token'], function(result) {
									user_model.getInfo(token, function(result) {
										if (result == null) 
											res.sendStatus(500);
										else
											res.send(result);
									});
								});
							}				
						});
					else 
						res.sendStatus(401);						
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
	} else {
		user_model.check(email, function(result) {
			if(result != null) {
				res.send(result);
			} else if (result == 0){
				res.sendStatus(404);
			} else {
				res.sendStatus(500);
			}
		});
	}
});

router.route('/meeting')
.get(function(req, res, next) {
	var token = req.query.token;

	user_model.getInfo(token ,function (result) {
		if (result == null) 
			res.sendStatus(404);
		else {
			var user_id = result.user.user_id;
			var time = new Date();
			var now = String(time.getFullYear()) + '-' + String(time.getMonth() + 1) + '-' + String(time.getDate());
			meeting_model.getPersonalMeetings(user_id, now, function(result) {
				res.send(result);
			});
		}
	});
});

module.exports = router;