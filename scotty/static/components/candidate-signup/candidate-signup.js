define(function(require) {
  'use strict';
  var module = require('app-module');
  var validStates = {
    'target_positions': [
      'signup.target1',
      'signup.target2',
      'signup.user',
    ],
    'work_experience': [
      'signup.experience1',
      'signup.experience2',
    ],
    'skills': [ 'signup.skills' ],
    'education': [
      'signup.education1',
      'signup.education2',
    ],
    'languages': [ 'signup.languages' ],
    'image': [ 'signup.photo' ],
    'active': [ 'signup.activate' ],
  };
  var order = [
    'signup.target1',
    'signup.target2',
    'signup.user',
    'signup.experience1',
    'signup.experience2',
    'signup.skills',
    'signup.education1',
    'signup.education2',
    'signup.languages',
    'signup.photo',
    'signup.activation',
    'profile',
  ];


  module.controller('CandidateSignupCtrl', function($scope, $state, CandidateSession) {
    var signup = this;
    var validated = null;
    this.nextStep = nextStep;
    this.atStep = atStep;
    this.ready = false;
    this.target = {};
    this.cities = [];
    this.user = {};
    this.experience = {};
    this.skills = [];
    this.education = {};
    this.languages = [];

    loadStep($state.current.name);

    $scope.$on('$stateChangeStart', function(event, state) {
      if (state.name.indexOf('signup') !== 0)
        return;

      if (validated !== state.name) {
        event.preventDefault();
        loadStep(state.name);
      }
    });

    function atStep(step) {
      return $state.current.name === step;
    }

    function nextStep() {
      var current = $state.current.name;
      var index = order.indexOf(current);
      var next = order[index + 1];
      return loadStep(next);
    }

    function loadStep(name) {
      return getValidStates().then(function(valid) {
        if (valid.indexOf(name) === -1)
          name = valid[0];

        name = checkPrevStates(name);
        validated = name;
        signup.ready = true;
        $state.go(name);
      });
    }

    function checkPrevStates(name) {
      var index;

      while (prevStepCompleted.hasOwnProperty(name)) {
        if (prevStepCompleted[name]())
          break;

        index = order.indexOf(name);
        name = order[index - 1];
      }

      return name;
    }

    function getValidStates() {
      return CandidateSession.getSignupStage().then(function(stage) {
        var destination = 'profile';
        if (!stage)
          return validStates.target_positions;

        stage.ordering.some(function(item) {
          if (!stage[item]) {
            destination = validStates[item];
            return true;
          }
        });

        return destination;
      });
    }

    var prevStepCompleted = {
      'signup.target2': function() {
        return (
          signup.target.company_type &&
          signup.target.role &&
          signup.target.skill
        );
      },
      'singup.user': function() {
        return (
          signup.target.minimum_salary &&
          signup.cities.length
        );
      },
      'singup.experience2': function() {
        return (
          signup.experience.company &&
          signup.experience.job_title &&
          signup.experience.location
        );
      },
      'singup.education2': function() {
        return (
          signup.education.institution &&
          signup.education.degree
        );
      },
    };




    if (DEBUG) {
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
        institution: guid(),
        degree: 'Master',
        course: guid(),
        end: '1998-7-01',
        start: '1994-3-01',
      };
      this.languages = [{
        language: 'spanish',
        proficiency: 'basic',
      }, {
        language: 'english',
        proficiency: 'advanced',
      }, {
        language: 'polish',
        proficiency: 'native',
      }];
    }
  });


  return {
    url: '/signup',
    template: require('text!./candidate-signup.html'),
    controller: 'CandidateSignupCtrl',
    controllerAs: 'signup',
  };
});
