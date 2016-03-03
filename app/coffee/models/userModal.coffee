# Pulls Mongoose dependency for creating schemas
mongoose = require 'mongoose'
Schema = mongoose.Schema
bcrypt = require 'bcrypt-nodejs'
config = require 'config'
SALT_WORK_FACTOR = config.get('Security.SALT_WORK_FACTOR')
u = require 'underscore'


# Creates a User Schema. This will be the basis of how user data is stored in the db
UserSchema = new Schema
	username: 
		type: String, 
	password:
		type: String
	email_id:
		type:String
		lowercase: true
		unique:true
	address:
		type:String
	temp_password:
		type:String
	phone_number:
		type:Number
	social_id:
		facebook:String
		google:String
	temp_password:String
	created_at: 
		type: Date
		default: Date.now
	updated_at: 
		type: Date
		default: Date.now

# Sets the created_at parameter equal to the current time and ecrypts the password
UserSchema.pre 'save',(next)->
	now = new Date()
	this.updated_at = now

	if this.username then this.username = titleCase this.username

	if !this.created_at then this.created_at = now 

	user = this
		
	# only hash the password if it has been modified (or is new)
	if  !user.isModified('password') then next()
	else
		bcrypt.genSalt SALT_WORK_FACTOR,(err,salt)->
			if err then next(err)

			bcrypt.hash user.password,salt,null,(err,hash)->
				if err then return next(err)

				# override cleartext with hash
				user.password = hash
				next()

UserSchema.methods.comparePassword = (candidatePassword,cb)->
	bcrypt.compare candidatePassword,this.password,(err, isMatch)->
		if err then return cb(err)
		cb err,isMatch

titleCase = (str)->
    str.replace /\w\S*/g,(txt)->
    	txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()


# Exports the UserSchema for use elsewhere. Sets the MongoDB collection to be used as: "shoppingsite-users"
module.exports = mongoose.model 'shoppingsite-user', UserSchema