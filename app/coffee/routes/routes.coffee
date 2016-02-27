mongoose = require 'mongoose'
moment = require 'moment'
jwt = require 'jsonwebtoken'
User = require '../models/userModal.js'
config = require 'config'

module.exports = (app)->
	apiRoutes = require('express').Router();

	app.post '/signUp',(req,res)->
		newUser = new User req.body
		newUser.save (err)->
			if err then res.send err
			res.json req.body

	app.post '/login',(req,res)->
		email_id = req.body.email_id
		password = req.body.password

		User.findOne {'email_id':email_id},(err,user)->
			if err then res.send err
			user.comparePassword password,(err,isMatch)->
				if err then res.send err

				payload=
					'email_id':email_id
					'username':user.username

				secret=config.get('Security.Secret')

				token = jwt.sign user,secret,
					expiresIn:86400

				res.json token

	apiRoutes.use (req,res,next)->
		token = req.body.token || req.query.token || req.headers['x-access-token'];
		if token
			jwt.verify token,config.get('Security.Secret'),(err,decoded)->
				if err
					res.json
						success:false
						message:'Failed to authenticate token.'
				else
					req.decoded = decoded
					next()
		else
			res.json 
				success:false
				message:'No token provided'
	apiRoutes.get '/', (req, res)-> 
  		res.json { message: 'Welcome to the coolest API on earth!' }
				
	app.use('/api', apiRoutes)


