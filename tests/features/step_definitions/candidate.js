/* globals stepDefinitions, assert, AJAX */

stepDefinitions(function(scenario) {
  'use strict';


  scenario.Before(function() {
    return AJAX.get('/candidates/logout', {}, { log: false })
      // if logout fails doesn't mean the test is failed
      // so we catch it and pass
      .catch(function() { });
  });


  scenario.Given(/^Candiate logs in$/, function() {
    return this.storeRequest(AJAX.post('/candidates/login', {
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
    }));
  });

  scenario.Given(/^Candiate logs out$/, function() {
    return this.storeRequest(AJAX.get('/candidates/logout'));
  });

  scenario.When(/^I post a new candidate$/, function() {
    this.candidateEmail = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  });

  scenario.Given(/^I post a new candidate with invitation code$/, function() {
    this.candidateEmail = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      'invite_code': this.inviteCode,
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  });

  scenario.When(/^Candidate request a password reset$/, function() {
    return this.storeRequest(AJAX.post('/candidates/requestpassword', {
      email: this.candidateEmail,
    })).then(function(response) {
      this.passwordToken = response.token;
    }.bind(this));
  });

  scenario.When(/^Candidate validates password token$/, function() {
    return this.storeRequest(AJAX.get('/candidates/resetpassword/' + this.passwordToken));
  });

  scenario.When(/^Candidate resets password to "([^"]*)"$/, function(password) {
    return this.storeRequest(AJAX.post('/candidates/resetpassword/' + this.passwordToken, { pwd: password }));
  });

  scenario.Then(/^The response should have candidate's email on "([^"]*)" field$/, function(key) {
    assert(key in this.lastResponse, 'Field "' + key + '" not found in response: ' + JSON.stringify(this.lastResponse));
    assert(this.lastResponse[key] === this.candidateEmail,
      'Expected email to be "' + this.candidateEmail + '" but "' + this.lastResponse[key] + '" found');
  });
});


