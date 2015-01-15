/* globals stepDefinitions, AJAX */

stepDefinitions(function(scenario) {
  'use strict';
  var apikey = 'apikey=' + window.config.admin_apikey;


  scenario.Given(/^I create an invitation code$/, function() {
    this.vars.invite_code = 'INVITE-CODE-TEST-' + this.guid();

    return this.storeRequest(AJAX.post('/admin/invite_codes?' + apikey, {
      code: this.vars.invite_code,
      description: 'Baylays invite code TEST',
    }));
  });

  scenario.When(/^I list invite codes$/, function() {
    return this.storeRequest(AJAX.get('/admin/invite_codes?' + apikey));
  });

  scenario.When(/^Candidate is approved$/, function() {
    return this.storeRequest(AJAX.get('/admin/candidates/' + this.vars.candidate_id + '/approve?' + apikey));
  });

  scenario.When(/^Employer is approved$/, function() {
    return this.storeRequest(AJAX.get('/admin/employers/' + this.vars.employer_id + '/approve?' + apikey));
  });
});
