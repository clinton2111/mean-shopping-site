(function() {
  angular.module('meanShoppingApp.authentication', ['angularValidator']).controller('authenticationController', [
    '$scope', '$auth', '$localStorage', 'md5', '$stateParams', 'authenticationService', function($scope, $auth, $localStorage, md5, $stateParams, authenticationService) {
      if ($stateParams.type === 'recovery' && !_.isUndefined($stateParams.value) && !_.isUndefined($stateParams.email)) {
        $scope.recovery_screen = true;
        $scope.header = 'Reset Password';
      } else {
        $scope.recovery_screen = false;
        $scope.header = 'Login';
      }
      $scope.loginError = null;
      $scope.signUpError = null;
      $scope.username = null;
      $scope.recoverStatus = null;
      $scope.updateStatus = null;
      $scope.signUp = function(data) {
        var payload;
        payload = {
          username: data.username,
          phone_number: data.phone_number,
          email_id: data.email_id,
          password: md5.createHash(data.password || '')
        };
        return $auth.signup(payload, [
          {
            skipAuthorization: true
          }
        ]).then(function(data) {
          $scope.signup.username = '';
          $scope.signup.phone_number = '';
          $scope.signup.email_id = '';
          $scope.signup.password = '';
          $scope.signup.confirmPassword = '';
          $auth.setToken(data);
          $scope.isAuthenticated();
          return $('#SignUp').modal('hide');
        }, function(error) {
          return $scope.signUpError = error.data;
        });
      };
      $scope.logIn = function(data) {
        var payload;
        payload = {
          email_id: data.email_id,
          password: md5.createHash(data.password || '')
        };
        return $auth.login(payload, [
          {
            skipAuthorization: true
          }
        ]).then(function(data) {
          $localStorage.resetDate = moment().format('DD-MM-YYYY');
          $scope.isAuthenticated();
          return $('#Login').modal('hide');
        }, function(error) {
          return $scope.loginError = error.data;
        });
      };
      $scope.authenticate = function(provider) {
        return $auth.authenticate(provider).then(function(data) {
          console.log('You have logged in with ' + provider);
          if ($('#Login').is(':visible')) {
            return $('#Login').modal('hide');
          }
        }, function(error) {
          return console.log(error);
        });
      };
      $scope.toggleForgotPass = function() {
        if ($scope.forgotPassword === false) {
          $scope.forgotPassword = true;
          return $scope.header = 'Recover Password';
        } else {
          $scope.forgotPassword = false;
          return $scope.header = 'Login';
        }
      };
      $scope.recoverPassword = function(recovery) {
        return authenticationService.recoverPassword(recovery).then(function(data) {
          return $scope.recoverStatus = {
            status: data.data.message,
            flag: 'success'
          };
        }, function(error) {
          return $scope.recoverStatus = {
            status: error.data.message,
            flag: 'error'
          };
        });
      };
      $scope.updatePassword = function(data) {
        data = {
          password: md5.createHash(data.password || ''),
          email_id: $stateParams.email,
          temp_password: $stateParams.value
        };
        return authenticationService.updatePassword(data).then(function(data) {
          return $scope.updateStatus = {
            status: data.data.message,
            flag: 'success'
          };
        }, function(error) {
          return $scope.updateStatus = {
            status: data.data.message,
            flag: 'success'
          };
        });
      };
      $scope.isAuthenticated = function() {
        var authFlag, payload;
        authFlag = $auth.isAuthenticated();
        if (!authFlag) {
          return authFlag;
        } else {
          payload = $auth.getPayload();
          $scope.username = payload.username;
          return authFlag;
        }
      };
      $scope.passwordValidator = function(password) {
        if (!password) {
          return;
        }
        if (password.length < 6) {
          return 'Password must be at least ' + 6 + ' characters long';
        }
        if (!password.match(/[A-Z]/)) {
          return 'Password must have at least one capital letter';
        }
        if (!password.match(/[0-9]/)) {
          return 'Password must have at least one number';
        }
        return true;
      };
      $scope.logout = function() {
        $auth.logout();
        return $scope.username = null;
      };
      return $scope.$watch(['username'], function() {
        return $scope.$apply;
      }, true);
    }
  ]);

}).call(this);
