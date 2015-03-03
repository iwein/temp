define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  var validStates = {
    'start': [ 'signup.start' ],
    'step1': [ 'signup.basic' ],
    'step2': [ 'signup.offices' ],
    'step3': [ 'signup.mission' ],
    'step4': [ 'signup.facts' ],
    'step5': [ 'signup.benefits' ],
    'step6': [ 'signup.terms' ],
    'end': [ 'signup-complete' ]
  };
  var order = [
    'signup.start',
    'signup.basic',
    'signup.offices',
    'signup.mission',
    'signup.facts',
    'signup.benefits',
    'signup.terms',
    'signup-complete',
  ];


  module.controller('SignupCtrl', [
    '$scope',
    '$state',
    'Session',
    require('tools/signup-controller')('employer', order, validStates),
  ]);


  return {
    url: '/signup',
    template: require('text!./employer-signup.html'),
    controller: 'SignupCtrl',
    controllerAs: 'signup'
  };
});
