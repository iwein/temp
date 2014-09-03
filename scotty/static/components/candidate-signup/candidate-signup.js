define(function(require) {
  'use strict';
  require('components/candidate-signup-target1/candidate-signup-target1');
  require('components/candidate-signup-target2/candidate-signup-target2');
  var module = require('app-module');


  module.controller('CandidateSignupCtrl', function($state) {
    this.data = {
      target: {},
    };

    switch ($state.current.name) {
      case 'signup':
        $state.go('signup.target1');
        break;

      case 'signup.target1':
        break;

      case 'signup.target2':
        //if (!this.data.target.skill)
        //  $state.go('signup.target1');
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
