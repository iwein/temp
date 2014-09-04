define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('CandidateSignupCtrl', function($state, CandidateSession) {
    var signup = this;
    this.ready = false;
    this.target = {};
    this.cities = [];
    this.user = {};
    this.experience = {};
    this.skills = [];

    if (true) {
      var barcelona = {
        city: 'Barcelona',
        country_iso: 'ES',
      };

      // jshint camelcase:false
      this.target = {
        company_type: 'large',
        role: 'Developer',
        minimum_salary: 10000,
        skill: 'Javascript',
      };
      this.cities = [ barcelona ];
      this.user = {
        first_name: 'A. Matías',
        last_name: 'Quezada',
        email: 'amatiasq+test' + (localStorage.foobar++) + '@gmail.com',
        pwd: '123123123',
      };
      this.experience = {
        company: 'Intel Corp.',
        job_title: 'Developer',
        location: barcelona,
        level: 'basic',
        role: 'Developer',
        start: '1999-04-01',
        end: '2001-09-01',
        summary: 'Foo bar quz',
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

    function userCompleted() {
      return CandidateSession.hasSession();
    }

    CandidateSession.whenReady(function() {
      signup.ready = true;

      switch ($state.current.name) {
        case 'signup.experience1':
          if (!userCompleted())
            $state.go('signup.user');

          /* falls through */
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
  });


  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup',
  };
});
