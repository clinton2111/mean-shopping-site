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
