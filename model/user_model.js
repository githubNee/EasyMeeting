var db = require('../util/db');

// 构造user model
function create(body) {
	var email = body['email'],
		password = body['password'],
		username = body['username'],
		gender = body['gender'],
		description = body['description'];

	if ((email && password && username && gender && description) == undefined) {
		return null;
	}
	if (email == '' || password == '')
		return null;

	var user = {
		email: email,		
		password: password,
		username: username,
		gender: gender,
		description: description
	}

	return user;
}

function login(email, callback) {
	var sql = "select password, token from user where email=\'" + email + "\';";

	db.do_query(sql, function(result) {
		if (result.length == 0) 
			callback(null);
		else
			callback(result[0]);
	})
}

// 根据token获取用户信息
function getInfo(token, callback) {
	var sql = "select * from user_info where token=\'" + token + "\';";
	db.do_query(sql, function(result) {
		if (result.length == 0) 
			callback(null);
		else 
			callback(result[0]);
	});
}

// 查询email是否被注册
function check(email, callback) {
	var sql = "select count(*) as number from user where email=\'" + email + '\'';
	db.do_query(sql, function(result) {
		callback(result[0]['number']);
	});
}

// 新建用户 同时新建用户信息
function insert(user, callback) {
	var sql_user = "insert into user values (null,\'" + user.email + "\',\'" + user.password + "\',\'" + user.token + '\');';
	db.do_query(sql_user, function() {
		console.log('user created');

		var sql_user_info = "insert into user_info values (\'" + user.token + '\',' + user.gender + ",\'" + user.username + "\',\'" + user.description + "\');";
		db.do_query(sql_user_info, function () {
			console.log('user info created');
			callback('success');
		});
	});

	
}

var user_model = {
	create: create,
	check: check,
	insert: insert,
	login: login,
	getInfo: getInfo
}

module.exports = user_model;