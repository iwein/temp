define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('AboutUsCtrl', function($scope, $sce, API) {
    var parts = [
      'ABOUTUS_TOP',
      'ABOUTUS_LEFT',
      'ABOUTUS_RIGHT',
      'ABOUTUS_BOTTOM',
    ];

    API.get('/cms/get?keys=' + parts.join(',')).then(function(data) {
      data.forEach(function(part) {
        $scope[part.key.split('_')[1]] = $sce.trustAsHtml(part.value);
      });
    });
  });


  return {
    url: '/about-us/',
    template: require('text!./static-about-us.html'),
    controller: 'AboutUsCtrl',
  };
});
