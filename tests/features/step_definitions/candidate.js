/* globals stepDefinitions, assert, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  function createUser() {
    this.candidateEmail = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  }


  scenario.Before(function() {
    return AJAX.get('/candidates/logout', {}, { log: false })
      // if logout fails doesn't mean the test is failed
      // so we catch it and pass
      .catch(function() { });
  });


  scenario.Given(/^Candiate logs in$/, function() {
    return this.storeRequest(AJAX.post('/login', {
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
    }));
  });

  scenario.Given(/^Candiate logs out$/, function() {
    return this.storeRequest(AJAX.get('/candidates/logout'));
  });

  scenario.When(/^I post a new candidate$/, createUser);

  scenario.Given(/^I post a new candidate with invitation code$/, function() {
    this.candidateEmail = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      'invite_code': this.inviteCode,
      'email': this.candidateEmail,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  });

  scenario.When(/^Candidate request a password reset$/, function() {
    return this.storeRequest(AJAX.post('/candidates/requestpassword', {
      email: this.candidateEmail,
    })).then(function(response) {
      this.passwordToken = response.token;
    }.bind(this));
  });

  scenario.When(/^Candidate validates password token$/, function() {
    return this.storeRequest(AJAX.get('/candidates/resetpassword/' + this.passwordToken));
  });

  scenario.When(/^Candidate resets password to "([^"]*)"$/, function(password) {
    return this.storeRequest(AJAX.post('/candidates/resetpassword/' + this.passwordToken, { pwd: password }));
  });

  scenario.Then(/^The response should have candidate's email on "([^"]*)" field$/, function(key) {
    assert(key in this.lastResponse, 'Field "' + key + '" not found in response: ' + JSON.stringify(this.lastResponse));
    assert(this.lastResponse[key] === this.candidateEmail,
      'Expected email to be "' + this.candidateEmail + '" but "' + this.lastResponse[key] + '" found');
  });

  scenario.Given(/^I create a complete candidate$/, function() {
    return createUser().then(function() {
      return Promise.all([
        AJAX.post('/candidates/me/target_position', {
          'company_types': ['startup', 'top500'],
          'role': 'Java Developer',
          'skills': ['Python', 'PHP'],
          'relocate': true,
          'travel_willingness': '>50%',
          'minimum_salary': 100000
        }),
        AJAX.put('/candidates/me/preferred_locations', {
          'DE': ['Berlin','Leipzig','Hamburg'],
          'BR': ['Uberlândia']
        }),
        AJAX.put('/candidates/me/languages', [
          { 'language': 'German', 'proficiency': 'native' },
          { 'language': 'English', 'proficiency': 'advanced' },
          { 'language': 'French', 'proficiency': 'basic' },
        ]),
        AJAX.put('/candidates/me/skills', [
          { 'skill': 'Python', 'level': 'basic' },
          { 'skill': 'PHP', 'level': 'advanced' },
          { 'skill': 'Java', 'level': 'advanced' },
        ]),
        AJAX.post('/candidates/me/education', {
          'institution': 'Eidgenössische Technische Hochschule Zürich, Switzerland',
          'degree': 'NEWDEGREE-2fbb080a-df19-79b6-d62a-edd989efcee0',
          'start': 1992,
          'course': 'Programming'
        }),
        AJAX.post('/candidates/me/work_experience', {
          'company': 'Intel Corp.',
          'role': 'Project Architect',
          'city': 'ÜberSigourney Fanatastic Not Existing Town',
          'country_iso': 'DE',
          'start': '2004-01-01',
          'summary': 'Design of Intelligent Protoplasma'
        }),
        AJAX.post('/candidates/me/picture', {
          'url': 'http://www.hackandcraft.com/'
        }),
      ]);
    });
  });
});


