(function() {
  angular.module('meanShoppingApp.authentication').factory('authenticationService', [
    '$http', '$q', 'apiPrefix', function($http, $q, apiPrefix) {
      return {
        recoverPassword: function(emailData) {
          var q;
          emailData.type = 'recoverPassword';
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
        }
      };
    }
  ]);

}).call(this);
