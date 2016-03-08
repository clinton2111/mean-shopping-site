(function() {
  angular.module('meanShoppingApp.authentication', ['angularValidator']).controller('authenticationController', [
    '$scope', '$auth', '$localStorage', 'md5', '$stateParams', 'authenticationService', 'toastrService', '$state', function($scope, $auth, $localStorage, md5, $stateParams, authenticationService, toastrService, $state) {
      if ($stateParams.type === 'recovery' && !_.isUndefined($stateParams.value) && !_.isUndefined($stateParams.email)) {
        $scope.recovery_screen = true;
        $scope.header = 'Reset Password';
      } else {
        $scope.recovery_screen = false;
        $scope.header = 'Login';
      }
      $scope.username = null;
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
          $('#SignUp').modal('hide');
          return toastrService.createToast('success', data.data.message, 'Welcome');
        }, function(error) {
          return toastrService.createToast('error', error.data.message, 'Error');
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
          $('#Login').modal('hide');
          toastrService.createToast('success', data.data.message, 'Welcome');
          return $state.go('account.settings');
        }, function(error) {
          return toastrService.createToast('error', error.data.message, 'Error');
        });
      };
      $scope.authenticate = function(provider) {
        return $auth.authenticate(provider).then(function(data) {
          if ($('#Login').is(':visible')) {
            $('#Login').modal('hide');
          }
          toastrService.createToast('success', data.data.message, 'Welcome');
          return $state.go('account.settings');
        }, function(error) {
          return toastrService.createToast('error', error.data.message, 'Error');
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
          return toastrService.createToast('success', data.data.message, 'Message Sent');
        }, function(error) {
          return toastrService.createToast('error', error.data.message, 'Error');
        });
      };
      $scope.updatePassword = function(data) {
        data = {
          password: md5.createHash(data.password || ''),
          email_id: $stateParams.email,
          temp_password: $stateParams.value
        };
        return authenticationService.updatePassword(data).then(function(data) {
          return toastrService.createToast('success', data.data.message, 'Success');
        }, function(error) {
          return toastrService.createToast('error', error.data.message, 'Error');
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
        $scope.username = null;
        toastrService.createToast('success', 'Hope to see you back soon.', 'You have been logged out');
        return $state.go('home');
      };
      return $scope.$watch(['username'], function() {
        return $scope.$apply;
      }, true);
    }
  ]);

}).call(this);
