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

  scenario.Then(/^The response should have the (property|properties):$/, function(_, table) {
    var response = this.lastResponse;
    var values = table.raw();
    var key, value;

    for (var i = 0; i < values.length; i++) {
      key = values[i][0];
      value = values[i][1];
      assert(response[key] === value, 'Expected "' + key + '" to be "' + value + '" but "' + response[key] + '" found');
    }
  });

  scenario.When(/^I (post|put) to "([^"]*)":$/, function(method, url, values) {
    return this.storeRequest(AJAX[method](url, this.tableToObject(values)));
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
