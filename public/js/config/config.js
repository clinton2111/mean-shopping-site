(function() {
  angular.module('meanShoppingApp', ['ui.router', 'meanShoppingApp.authentication', 'meanShoppingApp.home', 'satellizer', 'ngStorage', 'angular-md5', 'meanShoppingApp.toastr']).config([
    '$stateProvider', '$urlRouterProvider', '$authProvider', '$locationProvider', 'apiPrefix', '$httpProvider', 'toastrConfig', function($stateProvider, $urlRouterProvider, $authProvider, $locationProvider, apiPrefix, $httpProvider, toastrConfig) {
      $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'html/home.html',
        controller: 'homeController'
      }).state('auth', {
        url: '/auth/:type/:email/:value',
        templateUrl: 'html/auth.html',
        controller: 'authenticationController'
      }).state('account', {
        url: '/account',
        abstract: true,
        templateUrl: 'html/account.html',
        data: {
          requiresLogin: true
        }
      }).state('account.settings', {
        url: '',
        templateUrl: 'html/accountsettings.html',
        data: {
          requiresLogin: true
        }
      });
      $urlRouterProvider.otherwise('/home');
      $urlRouterProvider.when('account', 'account.settings');
      $authProvider.loginUrl = apiPrefix + '/authenticate';
      $authProvider.signupUrl = apiPrefix + '/signUp';
      $authProvider.tokenPrefix = 'meanShoppingApp';
      $authProvider.authHeader = 'x-access-token';
      $authProvider.authToken = '';
      $authProvider.facebook({
        url: apiPrefix + '/auth/facebook',
        clientId: '1532207213746557'
      });
      $authProvider.google({
        url: apiPrefix + '/auth/google',
        clientId: '448263483500-g0obrhdrt8v40j8tfgopb34sskhd876i.apps.googleusercontent.com'
      });
      return angular.extend(toastrConfig, {
        positionClass: 'toast-top-center',
        timeOut: 4000
      });
    }
  ]).constant('apiPrefix', '/api').run([
    '$rootScope', '$state', '$http', 'apiPrefix', '$q', '$localStorage', '$auth', function($rootScope, $state, $http, apiPrefix, $q, $localStorage, $auth) {
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
              type: 'login',
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
          e.preventDefault();
          return $state.go('account.settings');
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
