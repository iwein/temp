define(function(require) {
  'use strict';
  require('components/candidate-signup-target1/candidate-signup-target1');
  require('components/candidate-signup-target2/candidate-signup-target2');
  var module = require('app-module');


  module.controller('CandidateSignupCtrl', function($state) {
    var signup = this;
    this.target = {};
    this.cities = [];
    this.user = {};

    if (DEBUG) {
      // jshint camelcase:false
      this.target = {
        company_type: 'large',
        role: 'Developer',
        minimum_salary: 10000,
        skill: 'Javascript',
      };
      this.cities = [{
        city: 'Barcelona',
        country_iso: 'ES',
      }];
      this.user = {
        first_name: 'A. Matías',
        last_name: 'Quezada',
        email: 'amatiasq+test@gmail.com',
        pwd: '123123123',
      };
    }

    function target1Completed() {
      return (
        signup.target.company_type &&
        signup.target.role &&
        signup.target.skill
      );
    }

    function target2Completed() {
      return (
        signup.target.minimum_salary &&
        signup.cities.length
      );
    }

    switch ($state.current.name) {
      case 'signup.user':
        if (!target2Completed())
          $state.go('signup.target2');

        /* falls through */
      case 'signup.target2':
        if (!target1Completed())
          $state.go('signup.target1');

        /* falls through */
      case 'signup.target1':
        break;

      case 'signup':
        $state.go('signup.target1');
        break;
    }
  });


  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup',
  };
});
