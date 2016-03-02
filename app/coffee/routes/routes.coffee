mongoose = require 'mongoose'
moment = require 'moment'
qs = require 'querystring'
request = require 'request'
jwt = require 'jsonwebtoken'
User = require '../models/userModal.js'
config = require 'config'
api_prefix = '/api'
u = require 'underscore'

module.exports = (app)->

	# Create JWT
	createJWT = (email_id,username,id)->
		payload=
			'email_id':email_id
			'username':username
			'_id':id

		secret=config.get('Security.Secret')

		token = jwt.sign payload,secret,
			expiresIn:"3 days"

		return token

	# Middleware to make sure user is authenticated
	ensureAuthenticated = (req,res,next)->
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

	app.post api_prefix+'/signUp',(req,res)->
		newUser = new User req.body
		newUser.save (err,result)->
			
			if err 
				res
				.status 500
				.send err
			else
				token = createJWT(result.email_id,result.username,result._id);
				res
				.status 201
				.send token: token

	app.post api_prefix+'/authenticate',(req,res)->
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

						token = createJWT(email_id,user.username,user._id)
						json =
							'token':token
						res.send json
					else
						res
						.status 401
						.send 'Incorrect Password'

	app.post api_prefix+'/auth/facebook',(req,res)->
		fields = ['id', 'email', 'link', 'name']
		accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
		graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
		params = 
			code: req.body.code
			client_id: req.body.clientId
			client_secret: config.get('Social_Keys.Facebook.AppSecret')
			redirect_uri: req.body.redirectUri

		# Step 1. Exchange authorization code for access token.
		request
		.get 
			url:accessTokenUrl
			qs:params
			json:true
		,(err,response,accessToken)->
			if response.statusCode is not 200 then res.status(500).send {message:accessToken.error.message}

			# Step 2. Retrieve profile information about the current user.
			request
			.get 
				url:graphApiUrl
				qs:accessToken
				json:true
			,(err,response,profile)->
				if response.statusCode is not 200 then res.status(500).send {message:profile.error.message}
				if req.header 'x-access-token'
					User.findOne
						facebook:profile.id
					,(err,existingUser)->
						token = req.body.token || req.query.token || req.headers['x-access-token']
						payload  = jwt.decode token
						User.findById payload._id,(err,user)->
							if !user then res.status(400).send({ message: 'User not found' })
							user.facebook = profile.id
							user.username = profile.name
							user.email_id = profile.email

							user.save (err,savedUser)->
								token = createJWT(user.email_id,user.username,savedUser._id);
								res.send token: token

				else
					User.findOne
						email_id:profile.email
					,(err,existingUser)->
						if existingUser
							if (existingUser.facebook) || (u.isUndefined existingUser.facebook) || (u.isNull existingUser.facebook)
								existingUser.facebook = profile.id
								existingUser.save (err)->
									if err
										res.send err

							token = createJWT(existingUser.email_id,existingUser.username,existingUser._id);
							res.send token: token

						else
							user=new User()
							user.facebook = profile.id
							user.username = profile.name
							user.email_id = profile.email
							user.save (err,savedUser)->
								token = createJWT(user.email_id,user.username,savedUser._id);
								res.send token: token	

	app.post api_prefix+'/auth/google',(req,res)->
		accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect'

		params =
			code: req.body.code,
			client_id: req.body.clientId
			client_secret: config.get('Social_Keys.Google.AppSecret')
			redirect_uri: req.body.redirectUri
			grant_type: 'authorization_code'
		
		#Step 1. Exchange authorization code for access token.
		request.post accessTokenUrl,
			json:true
			form:params
		,(err,response,token)->
			accessToken = token.access_token
			headers =
				Authorization: 'Bearer ' + accessToken

			# Step 2. Retrieve profile information about the current user.
			request.get
				url:peopleApiUrl
				headers:headers
				json:true
			,(err,response,profile)->
				if profile.error
					res
					.status 500
					.send
						message:profile.error.message

				# Step 3a. Link user accounts
				if req.header 'x-access-token'
					User.findOne
						google:profile.sub
					,(err,existingUser)->
						token = req.body.token || req.query.token || req.headers['x-access-token']
						payload  = jwt.decode token
						User.findById payload._id,(err,user)->
							if !user then res.status(400).send({ message: 'User not found' })
							user.google = profile.sub
							user.username = profile.name
							user.email_id = profile.email

							user.save (err,savedUser)->
								token = createJWT(user.email_id,user.username,savedUser._id);
								res.send token: token

				else
					# Step 3b. Create a new user account or return an existing one.
					User.findOne
						email_id:profile.email
					,(err,existingUser)->
						if existingUser
							
							if (existingUser.google) || (u.isUndefined existingUser.google) || (u.isNull existingUser.google)
								existingUser.google = profile.sub
								existingUser.save (err)->
									if err
										res.send err

							token = createJWT(existingUser.email_id,existingUser.username,existingUser._id);
							res.send token: token

						else
							user=new User()
							user.google = profile.sub
							user.username = profile.name
							user.email_id = profile.email
							user.save (err,savedUser)->
								token = createJWT(user.email_id,user.username,savedUser._id);
								res.send token: token	

	app.post api_prefix+'/refresh',ensureAuthenticated,(req,res)->
		
		try
			secret=config.get('Security.Secret')
			token = req.body.token || req.query.token || req.headers['x-access-token']
			decoded = jwt.decode token
			token = createJWT(decoded.email_id,decoded.username,decoded._id)
			json =
				'token':token
			res.send json

		catch err
			res
			.status 401
			.send err



