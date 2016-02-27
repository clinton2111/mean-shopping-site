(function() {
  angular.module('meanShoppingApp.authentication', ['angularValidator']).controller('authenticationController', [
    '$scope', 'authenticationService', function($scope, authenticationService) {
      $scope.$on('$viewContentLoaded', function() {});
      $scope.signUp = function() {
        $('#SignUp').modal('hide');
        return authenticationService.signUp($scope.signup).then(function(data) {
          $scope.signup.username = '';
          $scope.signup.phone_number = '';
          $scope.signup.email_id = '';
          $scope.signup.password = '';
          $scope.signup.confirmPassword = '';
          return console.log(data);
        }, function(error) {
          return console.log(error);
        });
      };
      $scope.logIn = function() {
        $('#Login').modal('hide');
        return authenticationService.login($scope.login).then(function(data) {
          $scope.login.email_id = '';
          $scope.login.password = '';
          return console.log(data);
        }, function(error) {
          return console.log(error);
        });
      };
      return $scope.passwordValidator = function(password) {
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
    }
  ]);

}).call(this);
