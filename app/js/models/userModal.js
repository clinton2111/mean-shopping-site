(function() {
  var SALT_WORK_FACTOR, Schema, UserSchema, bcrypt, config, mongoose;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  bcrypt = require('bcrypt-nodejs');

  config = require('config');

  SALT_WORK_FACTOR = config.get('Security.SALT_WORK_FACTOR');

  UserSchema = new Schema({
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    email_id: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      type: String
    },
    phone_number: {
      type: Number,
      required: true
    },
    created_at: {
      type: Date,
      "default": Date.now
    },
    updated_at: {
      type: Date,
      "default": Date.now
    }
  });

  UserSchema.pre('save', function(next) {
    var now, user;
    now = new Date();
    this.updated_at = now;
    if (!this.created_at) {
      this.created_at = now;
    }
    user = this;
    if (!user.isModified('password')) {
      next();
    }
    return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) {
        next(err);
      }
      return bcrypt.hash(user.password, salt, null, function(err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        return next();
      });
    });
  });

  UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    return bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) {
        return cb(err);
      }
      return cb(null, isMatch);
    });
  };

  module.exports = mongoose.model('shoppingsite-user', UserSchema);

}).call(this);
