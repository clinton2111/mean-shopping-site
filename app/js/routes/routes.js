(function() {
  var SALT_WORK_FACTOR, User, api_prefix, bcrypt, config, jwt, moment, mongoose, qs, request, sendGridKey, sendgrid, u;

  mongoose = require('mongoose');

  moment = require('moment');

  qs = require('querystring');

  request = require('request');

  jwt = require('jsonwebtoken');

  User = require('../models/userModal.js');

  config = require('config');

  api_prefix = '/api';

  u = require('underscore');

  sendGridKey = config.get('SendGrid.APIKey');

  sendgrid = require('sendgrid')(sendGridKey);

  SALT_WORK_FACTOR = config.get('Security.SALT_WORK_FACTOR');

  bcrypt = require('bcrypt-nodejs');

  module.exports = function(app) {
    var bcryptPassword, createJWT, ensureAuthenticated, generateRandomString;
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
    generateRandomString = function(length) {
      var chars, i, ref, result;
      chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      result = '';
      for (i = 0, ref = length - 1; 0 <= ref ? i <= ref : i >= ref; 0 <= ref ? i++ : i--) {
        result = result + chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
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
    bcryptPassword = function(password) {
      return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) {
          next(err);
        }
        return bcrypt.hash(password, salt, null, function(err, hash) {
          if (err) {
            return next(err);
          }
          return hash;
        });
      });
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
              'social_id.facebook': profile.id
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
                user.social_id.facebook = profile.id;
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
                if ((!existingUser.social_id.facebook) || (u.isUndefined(existingUser.social_id.facebook)) || (u.isNull(existingUser.social_id.facebook))) {
                  existingUser.social_id.facebook = profile.id;
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
                user.social_id.facebook = profile.id;
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
              'social_id.google': profile.sub
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
                user.social_id.google = profile.sub;
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
                if ((!existingUser.social_id.google) || (u.isUndefined(existingUser.social_id.google)) || (u.isNull(existingUser.social_id.google))) {
                  existingUser.social_id.google = profile.sub;
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
                user.social_id.google = profile.sub;
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
    app.post(api_prefix + '/refresh', ensureAuthenticated, function(req, res) {
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
    app.post(api_prefix + '/recoverPassword', function(req, res) {
      var email_id;
      email_id = req.body.email_id;
      return User.findOne({
        email_id: email_id
      }, function(err, user) {
        var id, msgStructure, payload, randomString, url, username;
        if (err) {
          res.send(err);
        }
        if (!user) {
          return res.status(401).send({
            message: 'No user with that email address'
          });
        } else {
          id = user._id;
          username = user.username;
          randomString = generateRandomString(100);
          url = config.get('Host') + '/#/auth/recovery/' + email_id + '/' + randomString;
          msgStructure = 'Hello ' + username + '<br> You have recently requested to retrieve your lost account password. Please click the link below to reset your password. <br><br>' + url;
          payload = new sendgrid.Email({
            to: [email_id],
            toname: [username],
            from: 'noreply@gameland.com',
            fromname: 'GameLand - Password Recovery',
            subject: 'Password Recovery Link',
            text: msgStructure.replace(/<\/?[^>]+(>|$)/g, ""),
            html: msgStructure,
            replyto: null
          });
          return sendgrid.send(payload, function(err, json) {
            if (err) {
              return res.status(500).send(err);
            } else {
              user.temp_password = randomString;
              return user.save(function(err) {
                if (err) {
                  return res.send(err);
                } else {
                  return res.status(200).send({
                    message: 'Message Sent. Please check your Inbox'
                  });
                }
              });
            }
          });
        }
      });
    });
    return app.post(api_prefix + '/updatePassword', function(req, res) {
      var email_id, password, temp_password;
      email_id = req.body.email_id;
      temp_password = req.body.temp_password;
      password = req.body.password;
      return User.findOne({
        email_id: email_id,
        temp_password: temp_password
      }, 'password temp_password', function(err, user) {
        console.log(user);
        if (err) {
          res.send(err);
        }
        if (!user) {
          return res.status(500).send({
            message: 'Something went wrong. Try again later'
          });
        } else {
          user.temp_password = null;
          user.password = password;
          return user.save(function(err) {
            return res.status(200).send({
              message: 'Password Changed Successfully, Please login to continue'
            });
          });
        }
      });
    });
  };

}).call(this);
