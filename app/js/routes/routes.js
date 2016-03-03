(function() {
  var User, api_prefix, config, jwt, moment, mongoose, qs, request, u;

  mongoose = require('mongoose');

  moment = require('moment');

  qs = require('querystring');

  request = require('request');

  jwt = require('jsonwebtoken');

  User = require('../models/userModal.js');

  config = require('config');

  api_prefix = '/api';

  u = require('underscore');

  module.exports = function(app) {
    var createJWT, ensureAuthenticated;
    createJWT = function(email_id, username, id) {
      var payload, secret, token;
      payload = {
        'email_id': email_id,
        'username': username,
        '_id': id
      };
      secret = config.get('Security.Secret');
      token = jwt.sign(payload, secret, {
        expiresIn: "3 days"
      });
      return token;
    };
    ensureAuthenticated = function(req, res, next) {
      var secret, token;
      token = req.body.token || req.query.token || req.headers['x-access-token'];
      if (token) {
        secret = config.get('Security.Secret');
        return jwt.verify(token, secret, function(err, decoded) {
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
    };
    app.post(api_prefix + '/signUp', function(req, res) {
      var newUser;
      newUser = new User(req.body);
      return newUser.save(function(err, result) {
        var token;
        if (err) {
          return res.status(500).send(err);
        } else {
          token = createJWT(result.email_id, result.username, result._id);
          return res.status(201).send({
            token: token
          });
        }
      });
    });
    app.post(api_prefix + '/authenticate', function(req, res) {
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
            var json, token;
            if (err) {
              res.send(err);
            }
            if (isMatch) {
              token = createJWT(email_id, user.username, user._id);
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
    app.post(api_prefix + '/auth/facebook', function(req, res) {
      var accessTokenUrl, fields, graphApiUrl, params;
      fields = ['id', 'email', 'link', 'name'];
      accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
      graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
      params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.get('Social_Keys.Facebook.AppSecret'),
        redirect_uri: req.body.redirectUri
      };
      return request.get({
        url: accessTokenUrl,
        qs: params,
        json: true
      }, function(err, response, accessToken) {
        if (response.statusCode === !200) {
          res.status(500).send({
            message: accessToken.error.message
          });
        }
        return request.get({
          url: graphApiUrl,
          qs: accessToken,
          json: true
        }, function(err, response, profile) {
          if (response.statusCode === !200) {
            res.status(500).send({
              message: profile.error.message
            });
          }
          if (req.header('x-access-token')) {
            return User.findOne({
              facebook: profile.id
            }, function(err, existingUser) {
              var payload, token;
              token = req.body.token || req.query.token || req.headers['x-access-token'];
              payload = jwt.decode(token);
              return User.findById(payload._id, function(err, user) {
                if (!user) {
                  res.status(400).send({
                    message: 'User not found'
                  });
                }
                user.facebook = profile.id;
                user.username = profile.name;
                user.email_id = profile.email;
                return user.save(function(err, savedUser) {
                  token = createJWT(user.email_id, user.username, savedUser._id);
                  return res.send({
                    token: token
                  });
                });
              });
            });
          } else {
            return User.findOne({
              email_id: profile.email
            }, function(err, existingUser) {
              var token, user;
              if (existingUser) {
                if ((!existingUser.facebook) || (u.isUndefined(existingUser.facebook)) || (u.isNull(existingUser.facebook))) {
                  existingUser.facebook = profile.id;
                  existingUser.save(function(err) {
                    if (err) {
                      return res.send(err);
                    }
                  });
                }
                token = createJWT(existingUser.email_id, existingUser.username, existingUser._id);
                return res.send({
                  token: token
                });
              } else {
                user = new User();
                user.facebook = profile.id;
                user.username = profile.name;
                user.email_id = profile.email;
                return user.save(function(err, savedUser) {
                  token = createJWT(user.email_id, user.username, savedUser._id);
                  return res.send({
                    token: token
                  });
                });
              }
            });
          }
        });
      });
    });
    app.post(api_prefix + '/auth/google', function(req, res) {
      var accessTokenUrl, params, peopleApiUrl;
      accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
      peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
      params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.get('Social_Keys.Google.AppSecret'),
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
      };
      return request.post(accessTokenUrl, {
        json: true,
        form: params
      }, function(err, response, token) {
        var accessToken, headers;
        accessToken = token.access_token;
        headers = {
          Authorization: 'Bearer ' + accessToken
        };
        return request.get({
          url: peopleApiUrl,
          headers: headers,
          json: true
        }, function(err, response, profile) {
          if (profile.error) {
            res.status(500).send({
              message: profile.error.message
            });
          }
          if (req.header('x-access-token')) {
            return User.findOne({
              google: profile.sub
            }, function(err, existingUser) {
              var payload;
              token = req.body.token || req.query.token || req.headers['x-access-token'];
              payload = jwt.decode(token);
              return User.findById(payload._id, function(err, user) {
                if (!user) {
                  res.status(400).send({
                    message: 'User not found'
                  });
                }
                user.google = profile.sub;
                user.username = profile.name;
                user.email_id = profile.email;
                return user.save(function(err, savedUser) {
                  token = createJWT(user.email_id, user.username, savedUser._id);
                  return res.send({
                    token: token
                  });
                });
              });
            });
          } else {
            return User.findOne({
              email_id: profile.email
            }, function(err, existingUser) {
              var user;
              if (existingUser) {
                if ((!existingUser.google) || (u.isUndefined(existingUser.google)) || (u.isNull(existingUser.google))) {
                  existingUser.google = profile.sub;
                  existingUser.save(function(err) {
                    if (err) {
                      return res.send(err);
                    }
                  });
                }
                token = createJWT(existingUser.email_id, existingUser.username, existingUser._id);
                return res.send({
                  token: token
                });
              } else {
                user = new User();
                user.google = profile.sub;
                user.username = profile.name;
                user.email_id = profile.email;
                return user.save(function(err, savedUser) {
                  token = createJWT(user.email_id, user.username, savedUser._id);
                  return res.send({
                    token: token
                  });
                });
              }
            });
          }
        });
      });
    });
    return app.post(api_prefix + '/refresh', ensureAuthenticated, function(req, res) {
      var decoded, err, json, secret, token;
      try {
        secret = config.get('Security.Secret');
        token = req.body.token || req.query.token || req.headers['x-access-token'];
        decoded = jwt.decode(token);
        token = createJWT(decoded.email_id, decoded.username, decoded._id);
        json = {
          'token': token
        };
        return res.send(json);
      } catch (_error) {
        err = _error;
        return res.status(401).send(err);
      }
    });
  };

}).call(this);
