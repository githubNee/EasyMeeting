var express = require('express');
var router = express.Router();
var request = require('request');
var user_model = require('../model/user_model');

router.route('/')
// 用户登录
.post(function(req, res, next) {
	var email = req.body['email'],
		password = req.body['password'];

	user_model.login(email, function(result) {

		if (result == null)
			res.sendStatus(404);
		else {
			if (result['password'] != password)
				res.sendStatus(401);
			else {
				var token = result['token'];
				user_model.getInfo(token, function(result) {
					if (result == null)
						res.sendStatus(500);
					else
						res.send(result);
				});
			}
		}
	})
});


module.exports = router;