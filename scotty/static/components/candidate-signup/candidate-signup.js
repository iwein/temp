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
    this.education = {};

    if (true) {
      var barcelona = {
        city: 'Barcelona',
        country_iso: 'ES',
      };

      var guid = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
      };
    })();

      // jshint camelcase:false
      this.target = {
        company_type: 'large',
        role: guid(),
        minimum_salary: 10000,
        skill: guid(),
      };
      this.cities = [ barcelona ];
      this.user = {
        first_name: guid(),
        last_name: guid(),
        email: 'amatiasq+test' + (localStorage.foobar++) + '@gmail.com',
        pwd: '123123123',
      };
      this.experience = {
        company: guid(),
        job_title: guid(),
        location: barcelona,
        level: 'basic',
        role: guid(),
        start: '1999-04-01',
        end: '2001-09-01',
        summary: 'Foo bar quz',
      };
      this.skills = [{
        level: 'basic',
        skill: guid(),
      }, {
        level: 'advanced',
        skill: guid(),
      }, {
        level: 'expert',
        skill: guid(),
      }];
      this.education = {
        institution: 'Harvard University, United States',
        degree: 'Master',
        course: 'Dunno',
        end: '1998-7-01',
        start: '1994-3-01',
      };

      // TODO:
      //   add redirections education2 => education1, experience2 => experience1
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
