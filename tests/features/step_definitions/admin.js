/* globals stepDefinitions, AJAX, assert */

stepDefinitions(function(scenario) {
  'use strict';


  scenario.Given(/^I create an invitation code$/, function() {
    this.inviteCode = 'INVITE-CODE-TEST-' + this.guid();

    return this.storeRequest(AJAX.post('/admin/invite_codes', {
      code: this.inviteCode,
      description: 'Baylays invite code TEST',
    }));
  });

  scenario.Then(/^The response should have invitation code$/, function() {
    var response = this.lastResponse;
    assert(response.invite_code, 'No invite_code object found');
    assert(
      response.invite_code.code === this.inviteCode,
      'Expected invite code to be "' + this.inviteCode + '" but "' + response.invite_code.code + '" found'
    );
  });

});
