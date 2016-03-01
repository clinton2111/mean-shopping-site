mongoose = require 'mongoose'
moment = require 'moment'
jwt = require 'jsonwebtoken'
User = require '../models/userModal.js'
config = require 'config'

module.exports = (app)->
	apiRoutes = require('express').Router();

	apiRoutes.post '/signUp',(req,res)->
		newUser = new User req.body
		newUser.save (err)->
			if err 
				res
				.status 500
				.send err
			else
				res
				.status 201
				.send 'User created successfully'

	apiRoutes.post '/authenticate',(req,res)->
		email_id = req.body.email_id
		password = req.body.password

		User.findOne {'email_id':email_id},(err,user)->
			if err then res.send err

			if !user
				res
				.status 401
				.send 'User not found'
			else	
				user.comparePassword password,(err,isMatch)->
					if err then res.send err
					
					if isMatch
						payload=
							'email_id':email_id
							'username':user.username
							'_id':user._id

						secret=config.get('Security.Secret')

						token = jwt.sign payload,secret,
							expiresIn:"3 days"
						json =
							'token':token
						res.send json
					else
						res
						.status 401
						.send 'Incorrect Password'

	apiRoutes.use (req,res,next)->
		token = req.body.token || req.query.token || req.headers['x-access-token'];
		if token
			secret=config.get('Security.Secret')
			jwt.verify token,secret,(err,decoded)->
				if err
					res
					.status 401
					.send 'Failed to authenticate token'
				else
					req.decoded = decoded
					next()
		else
			res
			.status 400
			.send 'No token provided'

	apiRoutes.post '/refresh',(req,res)->
		
		try
			secret=config.get('Security.Secret')
			token = req.body.token || req.query.token || req.headers['x-access-token']
			decoded = jwt.decode token
			payload=
				'email_id':decoded.email_id
				'username':decoded.username
				'_id':decoded._id

			token = jwt.sign payload,secret,
				expiresIn:"3 days"
			json =
				'token':token
			res.send json

		catch err
			res
			.status 401
			.send err

		


	apiRoutes.get '/', (req, res)-> 
  		res.json { message: 'Welcome to the coolest API on earth!' }
				
	app.use '/api', apiRoutes


