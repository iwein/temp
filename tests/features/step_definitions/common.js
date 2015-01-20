/*globals stepDefinitions, assert, AJAX */

stepDefinitions(function(scenario) {
  'use strict';
  AJAX.log = false;
  scenario.World = window.World;

  scenario.Before(function() {
    this.vars.year = new Date().getFullYear();
    this.vars.unique_skill = 'test-skill-' + this.guid();
  });

  scenario.After(function () {
    this.lastRequest = null;
    this.lastResponse = null;
  });

  scenario.When(/^I invoke "([^"]*)" endpoint$/, getEndpoint);
  scenario.When(/^I get "([^"]*)"$/, getEndpoint);
  function getEndpoint(endpoint) {
    /*jshint validthis:true */
    return this.storeRequest(AJAX.get(this.setVars(endpoint)));
  }

  scenario.When(/^I (post|put) to "([^"]*)":$/, function(method, url, json) {
    console.log(this.setVars(url));
    var post = this.json(this.setVars(json));
    return this.storeRequest(AJAX[method](this.setVars(url), post));
  });

  scenario.Then(/^The response status should be "([^"]*)"$/, function(status) {
    status = +status;
    assert(
      this.lastRequest.status === status,
      'Expected status "' + status + '" but "' + this.lastRequest.status + '" found'
    );
  });

  scenario.Then(/^The response should have:$/, function(json) {
    var parsed = this.setVars(json);
    var expected = this.json(parsed);
    assert(this.equal(this.lastResponse, expected),
      'Expected "' + JSON.stringify(this.lastResponse) + '" to be "' + parsed +
      '"\nVars:' + JSON.stringify(this.vars));
  });

  scenario.Then(/^The response should be:$/, function(json) {
    var parsed = this.setVars(json);
    var expected = this.json(parsed);
    assert(this.lastResponse === expected, 'Expected "' + parsed + '" but "' + this.lastResponse + '" found');
  });
});
