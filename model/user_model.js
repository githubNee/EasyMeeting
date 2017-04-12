var db = require('../util/db');

function create(body) {
	var username = body['username'],
		password = body['password'];

	var user = {
		username: username,
		password: password
	}

	return user;
}

function select(sql, callback) {
	db.do_query(sql, function(result) {
		callback(result);
	})
}

var user_model = {
	create: create,
	do_query: select
}

module.exports = user_model;