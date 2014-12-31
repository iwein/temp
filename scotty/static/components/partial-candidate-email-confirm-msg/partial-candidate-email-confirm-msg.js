define(function(require) {
  'use strict';
  var module = require('app-module');

  module.directive('hcCandidateEmailConfirmMsg', function(Session) {
    return {
      restrict: 'E',
      replace:true,
      scope: true,
      template: require('text!./partial-candidate-email-confirm-msg.html'),
      link: function($scope) {

        $scope.resend = function(){
          Session.resendActivation({}).then(function(reply) {
            $scope.resent = reply.success;
          });
        };
      }
    };
  });
});
