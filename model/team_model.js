var db = require('../util/db');

function create (body) {
	var name = body['name'],
		description = body['description'];

	if (name  == undefined) {
		return null;
	}
	if (description == undefined)
		description = '';

	var team = {
		name: name,
		description: description
	}

	return team;
}

function insert (team) {
	team['description'] = team['description'].replace("\'", "\\\'");
	team['description'] = team['description'].replace("\"", "\\\"");
	var sql = "insert into team(name, description, leader) values (\"" + team['name'] + "\", \"" + team['description'];
	sql += "\"," + team['leader'] + ");";
	db.do_query(sql, function(result) {
		var teamId = result['insertId'];
		sql = 'insert into user_team values(null, ' + team['leader'] + ', ' + teamId + ');';
		db.do_query(sql, function() {} );
	});
}

function getTeams(userId, callback) {
	var sql = 'select * from (' + 
		'select min(start_time) as next_time, team_id from meeting '+
	    'where team_id in (select team_id from user_team where user_id = 14) and (state = 0 or state = -1)' +
	    'group by team_id' +
		')a ' +
		'right outer join (' +
		'select * from team where team_id in (select team_id from user_team where user_id = 14)' +
		')b '+
		'on a.team_id = b.team_id';


	db.do_query(sql, function(result) {
		callback(result);
	});
}

function checkTeam(teamId, callback) {
	var sql = 'select count(*) as number from team where team_id = ' + teamId;
	db.do_query(sql, function(result) {
		callback(result[0]['number']);
	})
}

function getTeam(teamId, token, callback) {
	var sql = 'select * from team where team_id = (select team_id from user_team where team_id = ' + teamId;
	sql += ' and user_id = (select user_id from user where token = \'' + token + '\'));';
	db.do_query(sql ,function(result) {
		callback(result[0]);
	});
}

function addMember(teamId, memberId) {
	var sql = 'insert into user_team values(null, ' + teamId + ', ' + memberId + ');';
	db.do_query(sql, function() {});
}

function checkMember (teamId, memberId, callback) {
	var sql = 'select count(*) as number from user_team where team_id=' + teamId + ' and user_id=' + memberId + ';';
	db.do_query(sql, function(result) {
		callback(result[0]['number']);
	});
}

function getMembers (teamId, callback) {
	var sql = 'select * from user natural join user_info where user_id in (select user_id from user_team where team_id =' + teamId + ');';
	db.do_query(sql, function(result) {
		for (var index = 0; index < result.length; index++) {
			result[index]['password'] = undefined;
			result[index]['token'] = undefined;
		}
		callback(result);
	})
}

var team_model = {
	create: create,
	insert: insert,
	checkTeam: checkTeam,
	getTeam: getTeam,
	getTeams: getTeams,
	addMember: addMember,
	checkMember: checkMember,
	getMembers: getMembers
}

module.exports = team_model;