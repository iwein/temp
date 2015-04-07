define(function(require) {
  'use strict';
  var module = require('app-module');
  module.directive('hcDataUrl', function($parse, $q) {

    function readFile(file) {
      var deferred = $q.defer();
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = deferred.reject;
      reader.onload = function(event) {
        deferred.resolve(event.target.result);
      };
      return deferred.promise;
    }

    return {
      restrict: 'A',
      compile: function(elem, attr) {
        var model = $parse(attr.hcDataUrl).assign;
        var iteration = 0;

        return function postLink(scope, elem) {
          var element = elem[0];
          var thisIteration = ++iteration;

          element.addEventListener('change', function() {
            var files = [].slice.call(element.files);

            $q.all(files.map(readFile)).then(function(blob) {
              // only if this was the last change event
              if (thisIteration === iteration)
                model(scope, blob);
            });
          });
        };
      },
    };
  });
});
