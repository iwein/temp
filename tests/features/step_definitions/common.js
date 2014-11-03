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
      'Expected "' + JSON.stringify(this.lastResponse) + '" to be "' + json + '"');
  });

  scenario.When(/^I (post|put) to "([^"]*)":$/, function(method, url, json) {
    return this.storeRequest(AJAX[method](url, this.json(json)));
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

  scenario.Then(/^The response should be a list$/, function() {
    var list = this.lastResponse.data || this.lastResponse;
    var toString = Object.prototype.toString.call(list);
    assert(toString === '[object Array]', 'Expected list but "' + toString + '" found.');
  });

  scenario.Then(/^Each item should have fields:$/, function(table) {
    var list = this.lastResponse.data || this.lastResponse;

    this.forEach(list, function(object, index) {
      this.forEach(table, function(entry) {
        var key = entry[0];
        var type = entry[1];
        var typeOf = typeof object[key];
        assert(typeOf === type,
          'At [' + index + '] expected "' + key + '" to be "' + type + '" but "' + typeOf + '" found');
        assert(object[key], 'At [' + index + '] "' + key + '" is falsy');
      });
    }, this);
  });

  scenario.Then(/^The response should be:$/, function(json) {
    var expected = this.json(json);
    assert(this.lastResponse === expected, 'Expected "' + expected + '" but "' + this.lastResponse + '" found');
  });
});
