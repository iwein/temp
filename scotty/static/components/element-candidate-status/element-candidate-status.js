  define(function(require) {
  'use strict';
  var fn = require('tools/fn');
  var module = require('app-module');

  module.directive('hcCandidateStatus', function() {
    return {
      restrict: 'EA',
      template: require('text!./element-candidate-status.html'),
      scope: {
        candidate: '=',
        offers: '=',
      },
      link: function(scope) {
        var finalStatus = [ 'REJECTED', 'WITHDRAWN' ];
        scope.$watch('offers.length', update);
        scope.$watch('offerList.length', update);

        scope.$watch('candidate.status', function(value) {
          update(value);
          if (scope.candidate && !scope.offers)
            scope.candidate.getOffers().then(fn.setTo('offerList', scope));
        });

        function update(value) {
          if (value != null)
            scope.status = calculateStatus();
        }

        function isFinalStatus(status) {
          return finalStatus.indexOf(status) !== -1;
        }

        function calculateStatus() {
          var status = scope.candidate.status;
          var offers = scope.offers || scope.offerList;

          if (!offers)
            return null;

          if (status === 'sleeping')
            return 'sleeping';

          var offersStatus = offers.reduce(function(summary, value) {
            if (isFinalStatus(value.status))
              return null;

            if (value.status === 'CONTRACT_SIGNED')
              return 'hired';

            return summary || 'reviewing';
          }, null);

          return offersStatus ||'searching';
        }
      }
    };
  });
});
