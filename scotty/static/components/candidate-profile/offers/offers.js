define(function(require) {
  'use strict';
  var module = require('app-module');


  module.directive('hcCandidateOffers', function() {
    return {
      template: require('text!./offers.html'),
      scope: { model: '=' },
      link: function() {
        // TODO

        /*
        $scope.offers = data[2]
          .sort(function(a, b) { return b.data.annual_salary - a.data.annual_salary })
          .slice(0, 3);
        */
      }
    };
  });
});
