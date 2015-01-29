define(function(require) {
  'use strict';
  require('session');
  var fn = require('tools/fn');
  var module = require('app-module');


  // jshint maxparams:8
  module.controller('SignupStartCtrl', function($scope, $q, $state, gettext, toaster, Loader, ConfigAPI, Session) {
    this.onEmailChange = onEmailChange;
    this.onCompanyChange = onCompanyChange;
    this.submit = submit;
    $scope.invited = false;
    $scope.loading = true;
    $scope.invalidEmail = false;
    $scope.model = {};
    $scope.errorEmailAlreadyRegistered = false;
    $scope.errorCompanyAlreadyRegistered = false;
    var token = $state.params.token;
    Loader.page(true);
    Session.firstLogin = true;


    toaster.show('alert banner-message',
      gettext('<h2>Sign up as an Employer! Start looking for the best IT talent.</h2>' +
        'If you are looking to be get hired, click <a href="../candidate/#/signup"><b>here</b></a>!'),
      { html: true, untilStateChange: true });



    $scope.companyTypeMeta = {
      startup:{
        label: gettext('Startup Company'),
        help: gettext('started within the last 5 years')
      },
      midsized:{
        label: gettext('Mid Sized Company'),
        help: gettext('established and less than 1.000 employees')
      },
      large:{
        label: gettext('Large Corporation'),
        help: gettext('grown player with multi-national operations')
      },
      top500:{
        label: gettext('Fortune 500 Company'),
        help: gettext('among the leading 500 companies')
      }
    };

    $scope.searchCompanies = ConfigAPI.companies;
    ConfigAPI.companyTypes().then(fn.setTo('companyTypes', $scope));
    ConfigAPI.salutations().then(fn.setTo('salutations', $scope));

    $q.when(token).then(function(token) {
      if (!token) return;
      return Session.getInvitationData(token);
    }).then(function(data) {
      if (!data) return;
      $scope.invited = true;
      $scope.model = {
        company_name: data.company_name,
        contact_first_name: data.contact_first_name,
        contact_last_name: data.contact_last_name,
        contact_salutation: data.contact_salutation,
        email: data.email,
      };
    }, function() {
      toaster.error(gettext('Invalid invitation token.'));
    }).finally(function() {
      $scope.loading = false;
      Loader.page(false);
    });

    function onEmailChange() {
      $scope.errorEmailAlreadyRegistered = false;
    }

    function onCompanyChange(){
      $scope.errorCompanyAlreadyRegistered = false;
    }

    function submit() {
      if (!$scope.formSignupStart.$valid) return;

      $scope.loading = true;
      Loader.add('signup-start-saving');

      (token ?
        Session.signupInvited(token, $scope.model.pwd) :
        Session.signup($scope.model)
        ).then(function() {
          $scope.signup.nextStep();
        }).catch(function(request) {
          if(request.status === 409) {
            $scope.errorCompanyAlreadyRegistered = request.data.db_message === 'company_name';
            $scope.errorEmailAlreadyRegistered = request.data.db_message === 'email';
          } else {
            if(request.data.errors.email){
              $scope.formSignupStart.email.$setValidity('email', false);
            } else
              toaster.defaultError();
          }

        }).finally(function() {
          $scope.loading = false;
          Loader.remove('signup-start-saving');
        });
    }
  });

  return {
    url: '/start/:token',
    template: require('text!./employer-signup-start.html'),
    controller: 'SignupStartCtrl',
    controllerAs: 'signupStart',
  };
});


