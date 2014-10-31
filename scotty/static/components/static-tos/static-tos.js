define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('TermsOfServicesCtrl', function($scope, $sce, API) {
    var parts = [
      'TOS_TOP',
      'TOS_LEFT',
      'TOS_RIGHT',
      'TOS_BOTTOM',
    ];

    API.get('/cms/get?keys=' + parts.join(',')).then(function(data) {
      data.forEach(function(part) {
        $scope[part.key.split('_')[1]] = $sce.trustAsHtml(part.value);
      });
    });
  });


  return {
    url: '/terms-of-service/',
    template: require('text!./static-tos.html'),
    controller: 'TermsOfServicesCtrl',
  };
});
