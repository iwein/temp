/* globals stepDefinitions, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  scenario.Given(/^An employer and a candidate are created$/, function() {
    return scenario.step(/^I create a complete candidate$/)
      .then(function() { return scenario.step(/^I create a complete employer$/); })
      .then(function() { return scenario.step(/^Candidate is approved$/); })
      .then(function() { return scenario.step(/^Employer is approved$/); })
      .then(function() { return scenario.step(/^Candidate logs out$/); })
      .then(function() { return scenario.step(/^Employer logs out$/) });
  });


  scenario.When(/^Employer creates a new offer$/, function() {
    return this.storeRequest(AJAX.post('/employers/me/offers', {
      'candidate': {
        'id': this.vars.candidate_id,
      },
      'location': {
        'city': 'Berlin',
        'country_iso': 'DE'
      },
      'benefits': ['Coffee', 'Massages'],
      'technologies': ['PHP', 'Python'],
      'role': 'Senior Artchitect',
      'annual_salary': 50000,
      'message': 'Hi There, we like you, so we make this offer to you',
      'interview_details': 'We will interview you',
      'job_description': 'You will work for us'
    })).then(function(response) {
      this.vars.offer_id = response.id;
      console.log('Created offer:', this.vars.offer_id);
      return response;
    }.bind(this));
  });
});
