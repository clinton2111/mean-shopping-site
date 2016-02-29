(function() {
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
