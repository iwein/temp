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

  scenario.Then(/^The response should have:$/, function(json) {
    assert(this.equal(this.lastResponse, this.json(json)),
      'Expected "' + JSON.stringify(this.lastResponse) + '" to be "' + json +
      '"\nVars:' + JSON.stringify(this.vars));
  });

  scenario.When(/^I (post|put) to "([^"]*)":$/, function(method, url, json) {
    return this.storeRequest(AJAX[method](url, this.json(json)));
  });

  scenario.When(/^I invoke "([^"]*)" endpoint$/, getEndpoint);
  scenario.When(/^I get "([^"]*)"$/, getEndpoint);
  function getEndpoint(endpoint) {
    /*jshint validthis:true */
    return this.storeRequest(AJAX.get(endpoint));
  }

  scenario.Then(/^The response status should be "([^"]*)"$/, function(status) {
    status = +status;
    assert(
      this.lastRequest.status === status,
      'Expected status "' + status + '" but "' + this.lastRequest.status + '" found'
    );
  });

  scenario.Then(/^The response should be:$/, function(json) {
    var expected = this.json(json);
    assert(this.lastResponse === expected, 'Expected "' + expected + '" but "' + this.lastResponse + '" found');
  });
});
