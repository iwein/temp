/*globals stepDefinitions, assert, AJAX */

stepDefinitions(function(scenario) {
  'use strict';
  AJAX.log = false;
  scenario.World = window.World;


  scenario.Before(function() {
    // Something
  });

  scenario.After(function () {
    this.lastRequest = null;
    this.lastResponse = null;
    return AJAX.post('/logout', {}, { log: false })
      // if fails just pass
      .catch(function() { });
  });


  scenario.Given(/^Candiate logs in$/, function() {
    return this.storeRequest(AJAX.post('/candidates/login', {
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
    }));
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

  scenario.When(/^I invoke "([^"]*)" endpoint$/, function(endpoint) {
    return this.storeRequest(AJAX.get(endpoint));
  });

  scenario.Then(/^The response should have candidate's email on "([^"]*)" field$/, function(key) {
    assert(this.lastResponse[key], 'Field not found');
    assert(this.lastResponse[key] === this.candidateEmail, 'Email is not expected');
  });

  scenario.Then(/^The response status should be "([^"]*)"$/, function(status) {
    status = +status;
    assert(
      this.lastRequest.status === status,
      'Expected status "' + status + '" but "' + this.lastRequest.status + '" found'
    );
  });
});


