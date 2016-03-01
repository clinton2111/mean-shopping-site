/*! mean-shopping-site - v1.0.0 - 2016-03-01 */(function() {
  angular.module('meanShoppingApp', ['ui.router', 'meanShoppingApp.authentication', 'meanShoppingApp.home', 'satellizer', 'ngStorage', 'angular-md5']).config([
    '$stateProvider', '$urlRouterProvider', '$authProvider', '$locationProvider', 'apiPrefix', '$httpProvider', function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider, apiPrefix, $httpProvider) {
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
  ]).constant('apiPrefix', '/api').run([
    '$rootScope', '$state', '$http', 'apiPrefix', '$q', '$localStorage', '$auth', function($rootScope, state, $http, apiPrefix, $q, localStorage, $auth) {
      return $rootScope.$on('$stateChangeStart', function(e, to) {
        var lastUpdate, refreshToken, refreshTokenFlag;
        refreshToken = function() {
          var q;
          q = $q.defer();
          $http.post(apiPrefix + '/refresh', null).then(function(data) {
            return q.resolve(data.data);
          }, function(error) {
            console.log('Error');
            return q.reject(data);
          });
          return q.promise;
        };
        if (to.data && to.data.requiresLogin) {
          if ($auth.isAuthenticated() === false) {
            e.preventDefault();
            $state.go('auth', {
              type: login,
              email: null,
              value: null
            });
          } else {
            lastUpdate = null;
            if (_.isUndefined($localStorage.resetDate) === true) {
              lastUpdate = moment('21-11-1992', 'DD-MM-YYYY');
            } else {
              lastUpdate = moment($localStorage.resetDate, 'DD-MM-YYYY');
            }
            refreshTokenFlag = moment().isSame(moment(lastUpdate), 'day');
            if (!refreshTokenFlag) {
              refreshToken().then(function(data) {
                var tokenData;
                tokenData = data;
                if (!(_.isNull(tokenData.token) && _.isUndefined(tokenData.token))) {
                  $auth.setToken(tokenData.token);
                  return $localStorage.resetDate = moment().format('DD-MM-YYYY');
                } else {
                  e.preventDefault();
                  return $state.go('auth', {
                    type: 'login',
                    email: null,
                    value: null
                  });
                }
              }, function(error) {
                return e.preventDefault();
              });
            }
          }
        }
        if ((to.templateUrl === 'html/auth.html') && ($auth.isAuthenticated() === true)) {
          console.log('Go Home');
          return e.preventDefault;
        }
      });
    }
  ]).factory('authHttpResponseInterceptor', [
    '$q', '$location', function($q, $location) {
      return {
        response: function(response) {
          if (response.status === 401) {
            console.log('Response 401');
          }
          return response || $q.when(response);
        },
        responseError: function(rejection) {
          if (rejection.status === 401) {
            $location.path('/auth/login//').search('returnTo', $location.path());
          }
          return $q.reject(rejection);
        }
      };
    }
  ]);

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

(function() {
  angular.module('meanShoppingApp.home', []).controller('homeController', ['$scope', function($scope) {}]);

}).call(this);
