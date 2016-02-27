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
        }
      };
    }
  ]);

}).call(this);
