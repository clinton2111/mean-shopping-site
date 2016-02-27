# Pulls Mongoose dependency for creating schemas
mongoose = require 'mongoose'
Schema = mongoose.Schema
bcrypt = require 'bcrypt-nodejs'
SALT_WORK_FACTOR = 10

# Creates a User Schema. This will be the basis of how user data is stored in the db
UserSchema = new Schema
	username: 
		type: String, 
		required: true
	password:
		type: String
		required: true
	email_id:
		type:String
		required:true
	address:
		type:String
	phone_number:
		type:Number
		required:true
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
	if !this.created_at then this.created_at = now 

	user = this
	# only hash the password if it has been modified (or is new)
	if  !user.isModified('password') then next()

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
		cb null,isMatch

# Exports the UserSchema for use elsewhere. Sets the MongoDB collection to be used as: "shoppingsite-users"
module.exports = mongoose.model 'shoppingsite-user', UserSchema