/*! mean-shopping-site - v1.0.0 - 2016-02-29 */(function() {
  angular.module('meanShoppingApp', ['ui.router', 'meanShoppingApp.authentication', 'meanShoppingApp.home', 'satellizer', 'ngStorage', 'angular-md5']).config([
    '$stateProvider', '$urlRouterProvider', '$authProvider', '$locationProvider', 'apiPrefix', function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider, apiPrefix) {
      $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'html/home.html',
        controller: 'homeController'
      }).state('auth', {
        url: '/auth/:type/:email/:value',
        templateUrl: 'html/auth.html',
        controller: 'authenticationController'
      });
      $urlRouterProvider.otherwise('/home');
      $authProvider.loginUrl = apiPrefix + '/authenticate';
      $authProvider.signupUrl = apiPrefix + '/signUp';
      $authProvider.tokenPrefix = 'meanShoppingApp';
      $authProvider.authHeader = 'x-access-token';
      return $authProvider.authToken = '';
    }
  ]).constant('apiPrefix', '/api');

}).call(this);

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
          console.log(data);
          return $('#SignUp').modal('hide');
        }, function(error) {
          $scope.signUpError = error.data;
          return console.log(error);
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
          console.log(data);
          return $('#Login').modal('hide');
        }, function(error) {
          $scope.loginError = error.data;
          return console.log(error.data);
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
