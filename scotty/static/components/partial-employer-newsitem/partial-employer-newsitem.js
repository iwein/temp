define(function(require) {
  'use strict';
  var module = require('app-module');

  var CLASS_NAME_LOOKUP = {
    'SIGN_UP': 'news-ico-profile-signup',
    'PROFILE_PENDING': 'news-ico-profile-pending',
    'PROFILE_LIVE': 'news-ico-profile-live',
    'OFFER_REJECTED': 'news-ico-offer-rejected',
    'OFFER_ACCEPTED': 'news-ico-offer-accepted',
    'OFFER_NEGOTIATION': 'news-ico-offer-negotiation',
    'OFFER_SIGNED': 'news-ico-offer-signed',
    'OFFER_START_DATE': 'news-ico-offer-start-date',
    'BOOKMARKED_EMPLOYER': 'news-ico-offer-bookmarked-employer',
    'OFFER_SENT': 'news-ico-offer-received'
  };

  module.directive('hcEmployerNewsitem', function() {
    return {
      restrict: 'E',
      replace:true,
      scope: {
        entry: '='
      },
      template: require('text!./partial-employer-newsitem.html'),
      link: function($scope) {
        $scope.icon = function(entry){
          return CLASS_NAME_LOOKUP[entry.name];
        };
      }
    };
  });
});
