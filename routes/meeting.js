var express = require('express');
var token_helper = require('../util/token.js');
var router = express.Router();
var request = require('request');
var underscore = require('underscore');
var team_model = require('../model/team_model');
var user_model = require('../model/user_model');
var meeting_model = require('../model/meeting_model');

router.route('/:id/meeting')
.get(function(req, res, next) {
	var teamId = req.params.id,
		token = req.query['token'];
	user_model.getInfo(token, function(result) {
		if (result == null) {
			res.sendStatus(404);
		}
		else {
			team_model.checkTeam(teamId, function(result) {
				if(result == 0)
					res.sendStatus(404);
				else {
					team_model.getTeam(teamId, token, function(result) {
						if (result == null) 
							res.sendStatus(401);
						else {
							meeting_model.getMeetings(teamId, function(result) {
								res.send(result);								
							});
						}
					});
				}
			});
		}
	});

})
.post(function(req, res, next) {
	if (req.body['start_time'] == undefined)
		res.sendStatus(400);
	else {
		var teamId = req.params.id,
			token = req.body['token'];
		user_model.getInfo(token, function(result) {
			if (result == null) 
				res.sendStatus(404);
			else {
				team_model.checkTeam(teamId, function(result) {
					if(result == 0)
						res.sendStatus(404);
					else {
						team_model.getTeam(teamId, token, function(result) {
							if (result == null) 
								res.sendStatus(401);
							else {
								// meeting_model.insert(teamId, req.body, function (result) {
								// 	console.log(result);
								// 	res.send({result:result});
								// });
								meeting_model.insert(teamId, req.body, function(result) {
									res.status(201).send({meeting_id: result.insertId})
								});

							}
						});
					}
				});
			}
		});
	}
});

router.route('/meeting/:meetingId')
.get(function(req, res, next) {
	var meetingId = req.params.meetingId,
		token = req.query.token;
	user_model.getInfo(token, function(result) {
		if (result == null) {
			console.log('user not found');
			res.sendStatus(404);
		}
		else {
			meeting_model.getMeeting(meetingId, function(result) {
				if (result == 0) {
					console.log('meeting not found');
					res.sendStatus(404);
				}
				else 
					res.send(result);
			});
		}
	});
});


module.exports = router;
