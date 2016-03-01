(function() {
  angular.module('meanShoppingApp.authentication', ['angularValidator']).controller('authenticationController', [
    '$scope', '$auth', '$localStorage', 'md5', '$stateParams', function($scope, $auth, $localStorage, md5, $stateParams) {
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
      $scope.signUp = function() {
        var payload;
        payload = {
          username: $scope.signup.username,
          phone_number: $scope.signup.phone_number,
          email_id: $scope.signup.email_id,
          password: md5.createHash($scope.signup.password || '')
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
          payload = {};
          return $('#SignUp').modal('hide');
        }, function(error) {
          return $scope.signUpError = error.data;
        });
      };
      $scope.logIn = function() {
        var payload;
        payload = {
          email_id: $scope.login.email_id,
          password: md5.createHash($scope.login.password || '')
        };
        return $auth.login(payload, [
          {
            skipAuthorization: true
          }
        ]).then(function(data) {
          $localStorage.resetDate = moment().format('DD-MM-YYYY');
          $scope.login.email_id = '';
          $scope.login.password = '';
          payload = {};
          $scope.isAuthenticated();
          return $('#Login').modal('hide');
        }, function(error) {
          return $scope.loginError = error.data;
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
