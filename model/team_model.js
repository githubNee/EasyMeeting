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

function getTeams(userId, time, callback) {
	var sql = 'select b.team_id, b.name, b.create_date, b.description, b.leader, a.next_time from ( ' + 
		'select min(start_time) as next_time, team_id from meeting ' +
		'group by team_id having next_time>\'' + time + '\' ) a ' +
		'right outer join ( ' +
		'select * from user_team natural join team where user_id = ' + userId + ') b ' +
		'on a.team_id = b.team_id;';

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

function getTeamByLeader(teamId, token, callback) {
	var sql = 'select * from team join user';
	sql += ' on team.leader = user.user_id';
	sql += ' where user.token = \''+ token + '\' and team_id = ' + teamId;
	db.do_query(sql, function(result) {
		callback(result[0]);
	});
}

function addMember(teamId, memberIds) {
	var closure = (teamId, memberId) => result => {
		if (result[0]['number'] == 0) {
			var sql = 'insert into user_team values(null, ' + memberId + ', ' + teamId + ');';
			db.do_query(sql, function() {});
		}
	}

	for (var i = 0; i < memberIds.length; i++) {
		var sql = 'select count(*) as number from user_team natural join user where team_id=' + teamId + ' and user_id=' + memberIds[i] + ';';
		
		db.do_query(sql, closure(teamId, memberIds[i]));
	}	
}

function checkMember (teamId, memberId, callback) {
	var sql = 'select count(*) as number from user_team  natural join user where team_id=' + teamId + ' and user_id=' + memberId + ';';
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

function deleteMember (teamId, memberId, callback) {
	var sql = 'delete from user_team where team_id = ' + teamId + ' and user_id = ' + memberId;
	console.log(sql);
	db.do_query(sql, function(result) {
		callback(result);
	});
}

var team_model = {
	create: create,
	insert: insert,
	checkTeam: checkTeam,
	getTeam: getTeam,
	getTeams: getTeams,
	addMember: addMember,
	checkMember: checkMember,
	getMembers: getMembers,
	getTeamByLeader: getTeamByLeader,
	deleteMember: deleteMember
}

module.exports = team_model;