define(function(require) {
  'use strict';
  require('tools/config-api');
  require('session');
  var module = require('app-module');


  module.controller('SearchCtrl', function($scope, toaster, ConfigAPI, Session) {
    this.searchSkills = ConfigAPI.skills;
    this.onTermsChange = onTermsChange;

    function onTermsChange(terms) {
      Session.searchEmployers(terms).then(function(results) {
        $scope.employers = results;
      }).catch(function() {
        toaster.error('Endpoint not connected yet');
      });
    }
  });


  return {
    url: '/search-employers/',
    template: require('text!./candidate-search-employers.html'),
    controller: 'SearchCtrl',
    controllerAs: 'searchEmployers',
  };
});
