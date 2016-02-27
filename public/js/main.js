/*! mean-shopping-site - v1.0.0 - 2016-02-28 */(function() {
  angular.module('meanShoppingApp', ['ui.router', 'meanShoppingApp.authentication', 'meanShoppingApp.home']).config([
    '$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
      $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'html/home.html',
        controller: 'homeController'
      });
      return $urlRouterProvider.otherwise('/home');
    }
  ]);

}).call(this);

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

(function() {
  angular.module('meanShoppingApp.home', []).controller('homeController', ['$scope', function($scope) {}]);

}).call(this);

(function() {
  angular.module('meanShoppingApp.authentication').factory('authenticationService', [
    '$http', '$q', function($http, $q) {
      return {
        signUp: function(credentials) {
          var q;
          q = $q.defer();
          $http({
            url: '/signUp',
            data: credentials,
            method: 'post'
          }).then(function(data) {
            return q.resolve(data);
          }, function(error) {
            return q.reject(error);
          });
          return q.promise;
        },
        login: function(credentials) {
          var q;
          q = $q.defer();
          $http({
            url: '/login',
            data: credentials,
            method: 'post'
          }).then(function(data) {
            return q.resolve(data);
          }, function(error) {
            return q.reject(error);
          });
          return q.promise;
        }
      };
    }
  ]);

}).call(this);
