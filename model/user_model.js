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
	var sql = "select * from user_info natural join user where token=\'" + token + "\';";
	db.do_query(sql, function(result) {
		if (result.length == 0) 
			callback(null);
		else {
			result[0]['password'] = undefined;
			result[0]['token'] = undefined;
			var ret = {};
			ret['user'] = result[0];
			callback(ret);
		}
	});
}

// 查询email是否被注册
function check(email, callback) {
	var sql = "select user_id from user where email=\'" + email + '\'';
	db.do_query(sql, function(result) {
		callback(result[0]);
	});
}

// 检查token与email是否一致，如果存在不一致的返回1
function checkByToken(email, token, callback) {
	var sql = "select count(*) as number from user where email=\'" + email + "\' and token!=\'" + token + "\';";
	db.do_query(sql, function(result) {
		callback(result[0]['number']);
	})
}

// 检查token与密码是否一致，如果一致返回1
function checkPassword(token, password, callback) {
	var sql = "select count(*) as number from user where token=\'" + token + "\' and password=\'" + password + "\';";
	db.do_query(sql, function(result) {
		callback(result[0]['number']);
	})
}


// 新建用户 同时新建用户信息
function insert(user, callback) {
	var sql_user = "insert into user values (null,\'" + user.email + "\',\'" + user.password + "\',\'" + user.token + '\');';
	db.do_query(sql_user, function() {
		console.log('user created');

		var sql_user_info = "insert into user_info values (\'" + user.token + '\',' + user.gender + ",\'" + user.username + "\',\'" + user.description + "\');";
		db.do_query(sql_user_info, function () {
			callback('success');
		});
	});

	
}

function updateUser(email, password, token, oldToken, callback) {
	var sql = 'update user set email=\'' + email + '\',password=\'' + password + '\',token=\'' + token + '\' where token=\'' + oldToken + '\';';
	db.do_query(sql, function() {
		sql = 'update user_info set token=\'' + token + '\' where token=\'' + oldToken + '\';';
		db.do_query(sql, function() {
			callback();
		});
	});
	
}

function updateUserInfo(user, callback) {
	var sql = 'update user_info set';
	var attr_num = Object.getOwnPropertyNames(user).length;
	if (attr_num == 1) 
		callback();
	else {
		for (var attr in user) {
			if (attr != 'token') {
				sql += ' ' + attr + '=';
				console.log(attr + typeof(user[attr]))
				if (typeof(user[attr]) == 'number') {
					sql += user[attr] + ' ';
				} else {
					sql += '\'' + user[attr] + '\' '
				}
				if (--attr_num != 1) {
					sql += ',';
				} 
			}
		}
		sql += 'where token=\'' + user['token'] + '\';';
		db.do_query(sql, function(result) {
			console.log(result);
			if (result == null)
				callback(400);
			else 
				callback(200);
		})
	}
}

var user_model = {
	create: create,
	check: check,
	checkByToken: checkByToken,
	checkPassword: checkPassword,
	insert: insert,
	login: login,
	getInfo: getInfo,
	updateUser: updateUser,
	updateUserInfo: updateUserInfo
}

module.exports = user_model;