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
  });


  scenario.When(/^I invoke "([^"]*)" endpoint$/, function(endpoint) {
    return this.storeRequest(AJAX.get(endpoint));
  });

  scenario.Then(/^The response status should be "([^"]*)"$/, function(status) {
    status = +status;
    assert(
      this.lastRequest.status === status,
      'Expected status "' + status + '" but "' + this.lastRequest.status + '" found'
    );
  });
});
