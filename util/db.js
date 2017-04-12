var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '123.206.123.213',
    user: 'meeting',
    password: 'meeting',
    database:'meeting'
});

connection.do_query = function(sql, callback) {
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