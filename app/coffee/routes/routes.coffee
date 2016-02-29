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

						secret=config.get('Security.Secret')

						token = jwt.sign user,secret,
							expiresIn:259200
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
			jwt.verify token,config.get('Security.Secret'),(err,decoded)->
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

	apiRoutes.get '/', (req, res)-> 
  		res.json { message: 'Welcome to the coolest API on earth!' }
				
	app.use '/api', apiRoutes


