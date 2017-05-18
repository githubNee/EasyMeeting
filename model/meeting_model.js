var db = require('../util/db');


function insert(teamId, meeting) {
	if (meeting['name'] == undefined)
		meeting['name'] = ''; 
	if (meeting['end_time'] == undefined)
		meeting['end_time'] = '';
	if (meeting['color'] == undefined)
		meeting['color'] = '';
	if (meeting['introduction'] == undefined)
		meeting['introduction'] = '';
	meeting['introduction'] = meeting['introduction'].replace("\'", "\\\'");
	meeting['introduction'] = meeting['introduction'].replace("\"", "\\\"");	
	if (meeting['outline'] == undefined)
		meeting['outline'] = '';

	var sql = 'insert into meeting values(null, \'' + meeting['name'] + '\',\'' + meeting['start_time'] + '\',\'' + meeting['end_time'] + '\',-1,\'' + meeting['color'] + '\', \'' + meeting['introduction'] + '\',\'' + meeting['outline'] + '\',' + teamId + ');';
	// console.log(sql);
	db.do_query(sql, function() {});
}

function getMeetings(teamId, callback) {
	var sql = 'select * from meeting where team_id = ' + teamId + ';';
	db.do_query(sql, function(result) {
		callback(result);
	})
}

function getMeeting(teamId, meetingId, callback) {
	var sql = 'select * from meeting where team_id = ' + teamId + ' and meeting_id = ' + meetingId + ';';
	db.do_query(sql, function(result) {
		callback(result[0]);
	})
}

var meeting_model = {
	insert: insert,
	getMeetings: getMeetings,
	getMeeting: getMeeting
}

module.exports = meeting_model;
