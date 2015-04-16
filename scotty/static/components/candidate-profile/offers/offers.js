define(function(require) {
  'use strict';
  var module = require('app-module');


  module.directive('hcCandidateOffers', function() {
    return {
      template: require('text!./offers.html'),
      scope: { model: '=' },
      link: function(scope, elem, attr) {
        scope.showViewAll = 'hcViewAll' in attr;

        scope.$watch('model.$revision', function() {
          var offers = scope.model.getOffersCached() || [];
          scope.offers = offers
            .sort(function(a, b) { return b.data.annual_salary - a.data.annual_salary })
            .slice(0, 3);

          elem.parent()[isEmpty() ? 'addClass' : 'removeClass']('empty');
        });

        function isEmpty() {
          return !(scope.offers && scope.offers.length);
        }

      }
    };
  });
});
