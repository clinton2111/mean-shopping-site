(function() {
  var User, mongoose;

  mongoose = require('mongoose');

  User = require('../models/userModal.js');

  module.exports = function(app) {
    return app.post('/signUp', function(req, res) {
      var newUser;
      newUser = new User(req.body);
      console.log(newUser);
      return newUser.save(function(err) {
        if (err) {
          res.send(err);
        }
        return res.json(req.body);
      });
    });
  };

}).call(this);
