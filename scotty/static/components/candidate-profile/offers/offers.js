define(function(require) {
  'use strict';
  var module = require('app-module');


  module.directive('hcCandidateOffers', function() {
    return {
      template: require('text!./offers.html'),
      scope: { model: '=' },
      link: function() {
        // TODO
      }
    };
  });
});
