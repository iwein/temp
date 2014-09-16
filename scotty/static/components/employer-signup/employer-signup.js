define(function(require) {
  'use strict';
  require('session');
  var module = require('app-module');


  var validStates = {
    'start': [ 'signup.start' ],
    'step1': [ 'signup.basic' ],
    'step2': [ 'signup.mission' ],
    'step3': [ 'signup.facts' ],
    'step4': [ 'signup.benefits' ],
    'step5': [
      'signup.terms',
      'signup.tos',
      // HACK: now that signup forms share controller
      //   the last item should be the default view
      'signup.terms',
    ],
    'end': [ 'signup.suggest' ],
  };
  var order = [
    'signup.start',
    'signup.basic',
    'signup.mission',
    'signup.facts',
    'signup.benefits',
    'signup.terms',
    'signup.suggest',
  ];


  module.controller('SignupCtrl',
    require('tools/signup-controller')('employer', order, validStates));


  return {
    url: '/signup',
    template: require('text!./employer-signup.html'),
    controller: 'SignupCtrl',
    controllerAs: 'signup',
  };
});
