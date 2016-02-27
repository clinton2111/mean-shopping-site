mongoose = require 'mongoose'
User = require '../models/userModal.js'

module.exports = (app)->
	app.post '/signUp',(req,res)->
		newUser = new User req.body
		console.log newUser
		newUser.save (err)->
    		if err then res.send err
    		res.json req.body