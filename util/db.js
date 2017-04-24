var mysql = require('mysql');

var connection = {};

// 数据库的连接、查询与关闭
connection.do_query = function(sql, callback) {
	connection = mysql.createConnection({
	    host: '123.206.123.213',
	    user: 'meeting',
	    password: 'meeting',
	    database:'meeting'
	});

	connection.connect();
	connection.query(sql, function(err, result) {
		if(err) {
			console.log(err);
			return ;
		}
		callback(result);
	});
	connection.end();
}

module.exports = connection;