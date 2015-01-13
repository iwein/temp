/* globals stepDefinitions, assert, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  function createUser() {
    this.companyName = this.guid();
    this.employerEmail = this.generateEmail();

    return this.storeRequest(AJAX.post('/employers/', {
      company_name: this.companyName,
      company_type: "large",
      contact_first_name: "44836650-076a-51b1-0d22-7ea9e0b2a4c2",
      contact_last_name: "7a288f18-0227-c9ad-6626-76a1b67caa0f",
      contact_salutation: "Ms",
      email: this.employerEmail,
      pwd: "welcomepwd",
    }));
  }


  scenario.Before(function() {
    return AJAX.get('/employers/logout', {}, { log: false })
      // if logout fails doesn't mean the test is failed
      // so we catch it and pass
      .catch(function() { });
  });


  scenario.Given(/^Employer logs in$/, function() {
    return this.storeRequest(AJAX.post('/login', {
      'email': this.employerEmail,
      'pwd': 'welcomepwd',
    }));
  });

  scenario.Given(/^Employer logs out$/, function() {
    return this.storeRequest(AJAX.get('/employers/logout'));
  });

  scenario.When(/^I post a new employer$/, createUser);

  scenario.Given(/^I post a new employer with invitation code$/, function() {
    this.employerEmail = this.generateEmail();

    return this.storeRequest(AJAX.post('/employers/', {
      'invite_code': this.inviteCode,
      'email': this.employerEmail,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  });

  scenario.When(/^Employer request a password reset$/, function() {
    return this.storeRequest(AJAX.post('/employers/requestpassword', {
      email: this.employerEmail,
    })).then(function(response) {
      this.passwordToken = response.token;
    }.bind(this));
  });

  scenario.When(/^Employer validates password token$/, function() {
    return this.storeRequest(AJAX.get('/employers/resetpassword/' + this.passwordToken));
  });

  scenario.When(/^Employer resets password to "([^"]*)"$/, function(password) {
    return this.storeRequest(AJAX.post('/employers/resetpassword/' + this.passwordToken, { pwd: password }));
  });

  scenario.Then(/^The response should have employer's email on "([^"]*)" field$/, function(key) {
    assert(key in this.lastResponse, 'Field "' + key + '" not found in response: ' + JSON.stringify(this.lastResponse));
    assert(this.lastResponse[key] === this.employerEmail,
      'Expected email to be "' + this.employerEmail + '" but "' + this.lastResponse[key] + '" found');
  });
});


