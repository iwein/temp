/*globals stepDefinitions, assert, AJAX */

stepDefinitions(function(scenario) {
  'use strict';
  scenario.World = window.World;


  scenario.Before(function() {
    // Something
  });

  scenario.After(function () {
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

  scenario.Then(/^The response should have candidate's email on "([^"]*)" field$/, function(key) {
    assert(key in this.lastResponse, 'Field "' + key + '" not found in response: ' + JSON.stringify(this.lastResponse));
    assert(this.lastResponse[key] === this.candidateEmail, 'Expected email to be "' + this.candidateEmail + '" but "' + this.lastResponse[key] + '" found');
  });
});


