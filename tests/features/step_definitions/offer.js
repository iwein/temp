/* globals stepDefinitions, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  scenario.Given(/^An employer and a candidate are created$/, function() {
    return Promise.all([
      scenario.step(/^I create a complete candidate$/),
      scenario.step(/^I create a complete employer$/),
    ]).then(function() {
      return Promise.all([
        scenario.step(/^Candidate is approved$/),
        scenario.step(/^Employer is approved$/),
        scenario.step(/^Candidate logs out$/),
        scenario.step(/^Employer logs out$/),
      ]);
    });
  });
});
