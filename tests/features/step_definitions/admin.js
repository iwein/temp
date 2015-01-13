/* globals stepDefinitions, AJAX, assert, test_vars */

stepDefinitions(function(scenario) {
  'use strict';
  var apikey = 'apikey=' + test_vars.apikey;


  scenario.Given(/^I create an invitation code$/, function() {
    this.inviteCode = 'INVITE-CODE-TEST-' + this.guid();

    return this.storeRequest(AJAX.post('/admin/invite_codes?' + apikey, {
      code: this.inviteCode,
      description: 'Baylays invite code TEST',
    }));
  });

  scenario.When(/^I list invite codes$/, function() {
    return this.storeRequest(AJAX.get('/admin/invite_codes?' + apikey));
  });

  scenario.Then(/^The response should have invitation code$/, function() {
    var response = this.lastResponse;
    var code = response.invite_code ? response.invite_code.code : response.code;

    assert(code === this.inviteCode,
      'Expected invite code to be "' + this.inviteCode + '" but "' + code + '" found');
  });

  scenario.When(/^Candidate is approved$/, function() {
    return this.storeRequest(AJAX.get('/admin/candidates/' + this.lastCandidateId + '/approve?' + apikey));
  });

  scenario.When(/^Employer is approved$/, function() {
    return this.storeRequest(AJAX.get('/admin/employers/' + this.lastEmployerId + '/approve?' + apikey));
  });
});
