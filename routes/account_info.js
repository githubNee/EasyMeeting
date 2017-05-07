var express = require('express');
var token_helper = require('../util/token.js');
var router = express.Router();
var request = require('request');
var underscore = require('underscore');
var user_model = require('../model/user_model');


router.route('/')
// 更新用户信息
.put(function(req, res, next) {
	if (req.body['token'] == undefined)
		res.sendStatus(400);
	else {
		console.log(req.body);
		user_model.updateUserInfo(req.body, function(result) {
			if (result == 200)
				user_model.getInfo(req.body['token'], function(result) {
					if (result == null)
						res.sendStatus(500);
					else
						res.send(result);
				});
			else
				res.sendStatus(400);
		})
	}
});

module.exports = router;
