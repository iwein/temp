define(function(require) {
  'use strict';
  require('tools/config-api');
  var module = require('app-module');


  module.controller('SearchCtrl', function($scope, $q, toaster, ConfigAPI, Session) {
    this.searchSkills = ConfigAPI.skills;
    this.onTermsChange = onTermsChange;

    function onTermsChange(terms) {
      Session.searchEmployers(terms).then(function(employers) {
        return $q.all(employers.map(function(employer) {
          return employer.getData();
        }));
      }).then(function(results) {
        $scope.employers = results;
      }).catch(function() {
        toaster.defaultError();
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