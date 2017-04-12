var express = require('express');
var router = express.Router();
var request = require('request');
var user_model = require('../model/user_model');

router.route('/register')
.post(function(req, res, next) {
	var user = user_model.create(req.body);

	var sql = 'select * from user';
	user_model.do_query(sql, function(result) {
		console.log(result);
	})

	res.sendStatus(200);
});


module.exports = router;