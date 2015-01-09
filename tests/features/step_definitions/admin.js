/* globals stepDefinitions, AJAX, assert */

stepDefinitions(function(scenario) {
  'use strict';
  var apikey = 'apikey=6b23dd93c33e4100ce9332eff5df6e7b01e5a289681cdff';


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

});
