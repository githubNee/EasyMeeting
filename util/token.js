var crypto = require('crypto');

var token = {}
token.create = function (email, password) {
	var sha1 = crypto.createHash('sha1');

	var date = Date.now();
	sha1.update(date.toString());
	sha1.update(email);

	return sha1.digest(password).toString('base64');
}

module.exports = token;