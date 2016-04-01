(function() {
  angular.module('meanShoppingApp.directives', []).directive('showtab', [
    function() {
      return {
        link: function(scope, element, attrs) {
          return element.click(function(e) {
            e.preventDefault();
            return $(element).tab('show');
          });
        }
      };
    }
  ]);

}).call(this);
