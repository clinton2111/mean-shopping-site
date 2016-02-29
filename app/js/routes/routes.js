(function() {
  var User, config, jwt, moment, mongoose;

  mongoose = require('mongoose');

  moment = require('moment');

  jwt = require('jsonwebtoken');

  User = require('../models/userModal.js');

  config = require('config');

  module.exports = function(app) {
    var apiRoutes;
    apiRoutes = require('express').Router();
    apiRoutes.post('/signUp', function(req, res) {
      var newUser;
      newUser = new User(req.body);
      return newUser.save(function(err) {
        if (err) {
          return res.status(500).send(err);
        } else {
          return res.status(201).send('User created successfully');
        }
      });
    });
    apiRoutes.post('/authenticate', function(req, res) {
      var email_id, password;
      email_id = req.body.email_id;
      password = req.body.password;
      return User.findOne({
        'email_id': email_id
      }, function(err, user) {
        if (err) {
          res.send(err);
        }
        if (!user) {
          return res.status(401).send('User not found');
        } else {
          return user.comparePassword(password, function(err, isMatch) {
            var json, payload, secret, token;
            if (err) {
              res.send(err);
            }
            if (isMatch) {
              payload = {
                'email_id': email_id,
                'username': user.username
              };
              secret = config.get('Security.Secret');
              token = jwt.sign(user, secret, {
                expiresIn: 259200
              });
              json = {
                'token': token
              };
              return res.send(json);
            } else {
              return res.status(401).send('Incorrect Password');
            }
          });
        }
      });
    });
    apiRoutes.use(function(req, res, next) {
      var token;
      token = req.body.token || req.query.token || req.headers['x-access-token'];
      if (token) {
        return jwt.verify(token, config.get('Security.Secret'), function(err, decoded) {
          if (err) {
            return res.status(401).send('Failed to authenticate token');
          } else {
            req.decoded = decoded;
            return next();
          }
        });
      } else {
        return res.status(400).send('No token provided');
      }
    });
    apiRoutes.get('/', function(req, res) {
      return res.json({
        message: 'Welcome to the coolest API on earth!'
      });
    });
    return app.use('/api', apiRoutes);
  };

}).call(this);
