var db = require('../util/db');

function create(body) {
	// var 
	// 	password = body['password'],


	// var user = {
	// 	username: username,
	// 	password: password
	// }

	// return user;
}

function select(sql, callback) {
	db.do_query(sql, function(result) {
		callback(result);
	});
}

function check(email, callback) {
	sql = "select count(*) as number from user where email=\'" + email + '\'';
	db.do_query(sql, function(result) {
		callback(result[0]['number']);
	});
}

var user_model = {
	create: create,
	do_query: select,
	check: check
}

module.exports = user_model;