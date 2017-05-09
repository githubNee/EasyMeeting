var express = require('express');
var token_helper = require('../util/token.js');
var router = express.Router();
var request = require('request');
var underscore = require('underscore');
var team_model = require('../model/team_model');
var user_model = require('../model/user_model');

router.route('/')
.get(function(req, res, next) {
	var token = req.query['token'];

	user_model.getInfo(token, function(result) {
		if (result == null)
			res.sendStatus(404);
		else {
			var userId = result['user']['user_id'];

			team_model.getTeams(userId, function(result) {
				res.send(result);
			});
		} 
	});
	
})
.post(function(req, res, next) {
	var team = team_model.create(req.body);
	if (team == null)
		res.sendStatus(400);

	else {
		var token = req.body['token'];
		user_model.getInfo(token, function(result) {
			if (result == null)
				res.sendStatus(404);
			else {
				team['leader'] = result['user ']['user_id'];
				team_model.insert(team);
				res.sendStatus(200);
			}
		});
	}
});

router.route('/:id')
.get(function(req, res, next) {
	var teamId = req.params.id,
		token = req.query['token'];

	user_model.getInfo(token, function(result) {
		if (result == null) {
			console.log('user not found');
			res.sendStatus(404);
		}
		else {
			team_model.checkTeam(teamId, function(result) {
				if (result == 0)
					res.sendStatus(404);
				else {
					team_model.getTeam(teamId, token, function(result) {
						if (result == null)
							res.sendStatus(401);
						else 
							res.send(result);
					});
				}
			})
		}
	});
});


router.route('/:id/member')
.get(function(req, res, next) {
	var teamId = req.params.id,
		token = req.query['token'];
	user_model.getInfo(token, function(result) {
		if (result == null) 
			res.sendStatus(404);
		else {
			team_model.checkTeam(teamId, function(result) {
				if (result == 0)
					res.sendStatus(404);
				else {
					team_model.getTeam(teamId, token, function(result) {
						if (result == null)
							res.sendStatus(401);
						else {
							team_model.getMembers(teamId, function(result) {
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
	var teamId = req.params.id,
		token = req.body['token'],
		memberId = req.body['memberId'];
	user_model.getInfo(token, function(result) {
		if (result == null)
			res.sendStatus(404);
		else {
			team_model.checkTeam(teamId, function(result) {
				if (result == 0) 
					res.sendStatus(404);
				else {
					team_model.getTeam(teamId, token, function(result) {
						if (result == null)
							res.sendStatus(401);
						else {
							team_model.checkMember(teamId, memberId, function(result) {
								if (result == 1)
									res.sendStatus(400);
								else {
									team_model.addMember(teamId, memberId);
									res.sendStatus(200);		
								}
							});
							
						}
					});
				}
			});
		}
	});
});

module.exports = router;