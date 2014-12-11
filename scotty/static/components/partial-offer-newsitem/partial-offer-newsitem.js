define(function(require) {
  'use strict';
  var module = require('app-module');

  var CLASS_NAME_LOOKUP = {
    'OFFER_MADE': 'news-ico-offer-received',
    'REJECTED': 'news-ico-offer-rejected',
    'ACCEPTED': 'news-ico-offer-accepted',
    'INTERVIEWING': 'news-ico-offer-interviewing',
    'NEGOCIATING': 'news-ico-offer-negotiation',
    'CONTRACT_SIGNED': 'news-ico-offer-signed'
  };

  module.directive('hcCandidateOfferNewsitem', function() {
    return {
      restrict: 'E',
      replace:true,
      scope: {
        entry: '='
      },
      template: require('text!./partial-candidate-offer-newsitem.html'),
      link: function($scope) {
        $scope.icon = function(entry){
          return CLASS_NAME_LOOKUP[entry.name];
        };
      }
    };
  });

  module.directive('hcEmployerOfferNewsitem', function() {
    return {
      restrict: 'E',
      replace:true,
      scope: {
        entry: '='
      },
      template: require('text!./partial-employer-offer-newsitem.html'),
      link: function($scope) {
        $scope.icon = function(entry){
          return CLASS_NAME_LOOKUP[entry.name];
        };
      }
    };
  });
});
