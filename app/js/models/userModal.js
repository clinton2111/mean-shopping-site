(function() {
  var SALT_WORK_FACTOR, Schema, UserSchema, bcrypt, config, mongoose, titleCase, u;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  bcrypt = require('bcrypt-nodejs');

  config = require('config');

  SALT_WORK_FACTOR = config.get('Security.SALT_WORK_FACTOR');

  u = require('underscore');

  UserSchema = new Schema({
    username: {
      type: String
    },
    password: {
      type: String
    },
    email_id: {
      type: String,
      lowercase: true,
      unique: true
    },
    address: {
      type: String
    },
    temp_password: {
      type: String
    },
    phone_number: {
      type: Number
    },
    facebook: String,
    google: String,
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
    this.username = titleCase(this.username);
    if (!this.created_at) {
      this.created_at = now;
    }
    user = this;
    if (!((u.isUndefined(this.password)) || (u.isNull(this.password)) || (this.password === ""))) {
      if (!user.isModified('password')) {
        next();
      } else {
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
          if (err) {
            next(err);
          }
          return bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) {
              return next(err);
            }
            return user.password = hash;
          });
        });
      }
    }
    return next();
  });

  UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    return bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) {
        return cb(err);
      }
      return cb(null, isMatch);
    });
  };

  titleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  module.exports = mongoose.model('shoppingsite-user', UserSchema);

}).call(this);
