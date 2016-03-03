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
