/*! mean-shopping-site - v1.0.0 - 2016-03-04 */(function() {
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
      });
      $urlRouterProvider.otherwise('/home');
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
    '$scope', '$auth', '$localStorage', 'md5', '$stateParams', 'authenticationService', 'toastrService', function($scope, $auth, $localStorage, md5, $stateParams, authenticationService, toastrService) {
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
          return toastrService.createToast('success', data.data.message, 'Welcome');
        }, function(error) {
          return toastrService.createToast('error', error.data.message, 'Error');
        });
      };
      $scope.authenticate = function(provider) {
        return $auth.authenticate(provider).then(function(data) {
          if ($('#Login').is(':visible')) {
            $('#Login').modal('hide');
          }
          return toastrService.createToast('success', data.data.message, 'Welcome');
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
        return toastrService.createToast('success', 'Hope to see you back soon.', 'You have been logged out');
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

(function() {
  angular.module('meanShoppingApp.authentication').factory('authenticationService', [
    '$http', '$q', 'apiPrefix', function($http, $q, apiPrefix) {
      return {
        recoverPassword: function(emailData) {
          var q;
          q = $q.defer();
          $http({
            url: apiPrefix + '/recoverPassword',
            method: 'POST',
            data: emailData,
            skipAuthorization: true
          }).then(function(data) {
            return q.resolve(data);
          }, function(error) {
            return q.reject(error);
          });
          return q.promise;
        },
        updatePassword: function(passwordData) {
          var q;
          q = $q.defer();
          $http({
            url: apiPrefix + '/updatePassword',
            method: 'POST',
            data: passwordData,
            skipAuthorization: true
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

(function() {
  angular.module('meanShoppingApp.toastr', ['ngAnimate', 'toastr']).factory('toastrService', [
    'toastr', function(toastr) {
      return {
        createToast: function(type, message, title) {
          var options;
          options = {};
          if (type === 'success') {
            return toastr.success(message, title, options);
          } else if (type === 'warning') {
            return toastr.warning(message, title, options);
          } else if (type === 'info') {
            return toastr.info(message, title, options);
          } else if (type === 'error') {
            return toastr.error(message, title, options);
          }
        }
      };
    }
  ]);

}).call(this);
