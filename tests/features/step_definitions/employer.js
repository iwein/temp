/* globals stepDefinitions, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  scenario.Before(function() {
    return AJAX.get('/employers/logout', {}, { log: false })
      // if logout fails doesn't mean the test is failed
      // so we catch it and pass
      .catch(function() { });
  });

  scenario.When(/^I post a new employer$/, function() {
    this.vars.company_name = 'test-company-' + this.guid();
    this.vars.employer_email = this.generateEmail();

    return this.storeRequest(AJAX.post('/employers/', {
      company_name: this.vars.company_name,
      company_type: 'large',
      contact_first_name: '44836650-076a-51b1-0d22-7ea9e0b2a4c2',
      contact_last_name: '7a288f18-0227-c9ad-6626-76a1b67caa0f',
      contact_salutation: 'Ms',
      email: this.vars.employer_email,
      pwd: 'welcomepwd',
    })).then(function(response) {
      this.vars.employer_id = response.id;
      console.log('Created employer:', this.vars.employer_id);
      return response;
    }.bind(this));
  });

  scenario.Given(/^I create a complete employer$/, function() {
    return scenario.step(/^I post a new employer$/).then(function() {
      return Promise.all([
        AJAX.put('/employers/me', {
          'website': 'http://localhost/static/apps/employer/#/signup/basic/',
          'fb_url': 'http://localhost/static/apps/employer/#/signup/basic/',
          'linkedin_url': 'http://localhost/static/apps/employer/#/signup/basic/',
          'logo_url': 'https://s3-eu-west-1.amazonaws.com/scotty-dev/logo/21064839-3bce-4a37-9124-6c2644e9af95',
          'funding_year': 1931,
          'no_of_employees': 2008,
          'revenue_pa': 43420,
          'mission_text': '336b6c2d-8663-7eac-d8a4-b57570bc0dd4',
          'tech_tags': [this.vars.unique_skill, 'Python'],
          'tech_team_philosophy': '338b32a1-e460-367d-900a-68fb8c441f09',
          'tech_team_size': 2003
        }),
        AJAX.put('/employers/me/offices', [{
          'contact_first_name': 'Martha',
          'contact_last_name': 'Stewart',
          'contact_salutation': 'Mr',
          'contact_email': this.vars.employer_email,
          'address_city': {
            'country_iso': 'DE',
            'city': 'Berlin'
          },
          'address_line1': 'Schoenhauser Allee 106',
          'address_zipcode': '08712',
          'contact_phone': '+49 232314 2435'
        }]),
      ]);
    }.bind(this)).then(function() {
      return AJAX.put('/employers/me/apply', { 'agreedTos':true });
    });
  });

  scenario.Given(/^Employer logs in$/, function() {
    return this.storeRequest(AJAX.post('/login', 'pwd=welcomepwd&email=' +
      encodeURIComponent(this.vars.employer_email)));
  });

  scenario.Given(/^Employer logs out$/, function() {
    return this.storeRequest(AJAX.get('/employers/logout'));
  });

  scenario.Given(/^I post a new employer with invitation code$/, function() {
    this.vars.employer_email = this.generateEmail();

    return this.storeRequest(AJAX.post('/employers/', {
      'invite_code': this.inviteCode,
      'email': this.vars.employer_email,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  });

  scenario.When(/^Employer request a password reset$/, function() {
    return this.storeRequest(AJAX.post('/employers/requestpassword', {
      email: this.vars.employer_email,
    })).then(function(response) {
      this.passwordToken = response.token;
    }.bind(this));
  });

  scenario.When(/^Employer validates password token$/, function() {
    return this.storeRequest(AJAX.get('/employers/resetpassword/' + this.passwordToken));
  });

  scenario.When(/^Employer resets password to "([^"]*)"$/, function(password) {
    return this.storeRequest(AJAX.post('/employers/resetpassword/' + this.passwordToken, { pwd: password }));
  });

});
