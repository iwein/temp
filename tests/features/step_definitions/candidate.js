/* globals stepDefinitions, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  function createUser() {
    this.vars.candidate_email = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      'email': this.vars.candidate_email,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    })).then(function(response) {
      this.vars.candidate_id = response.id;
      console.log('Created candidate:', this.vars.candidate_id);
      return response;
    }.bind(this));
  }


  scenario.Before(function() {
    return AJAX.get('/candidates/logout', {}, { log: false })
      // if logout fails doesn't mean the test is failed
      // so we catch it and pass
      .catch(function() { });
  });


  scenario.Given(/^Candidate logs in$/, function() {
    return this.storeRequest(AJAX.post('/login', {
      'email': this.vars.candidate_email,
      'pwd': 'welcomepwd',
    }));
  });

  scenario.Given(/^Candidate logs out$/, function() {
    return this.storeRequest(AJAX.get('/candidates/logout'));
  });

  scenario.When(/^I post a new candidate$/, createUser);

  scenario.Given(/^I post a new candidate with invitation code$/, function() {
    this.vars.candidate_email = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      'invite_code': this.vars.invite_code,
      'email': this.vars.candidate_email,
      'pwd': 'welcomepwd',
      'first_name': 'Bob',
      'last_name': 'Bayley',
    }));
  });

  scenario.When(/^Candidate request a password reset$/, function() {
    return this.storeRequest(AJAX.post('/candidates/requestpassword', {
      email: this.vars.candidate_email,
    })).then(function(response) {
      this.vars.password_token = response.token;
    }.bind(this));
  });

  scenario.When(/^Candidate validates password token$/, function() {
    return this.storeRequest(AJAX.get('/candidates/resetpassword/' + this.vars.password_token));
  });

  scenario.When(/^Candidate resets password to "([^"]*)"$/, function(password) {
    return this.storeRequest(AJAX.post('/candidates/resetpassword/' + this.vars.password_token, { pwd: password }));
  });

  scenario.Given(/^I create a complete candidate$/, function() {
    return createUser.call(this).then(function() {
      return Promise.all([
        AJAX.post('/candidates/me/target_position', {
          'role': 'System Administration',
          'skills': ['Python', 'PHP'],
          'minimum_salary': 40000
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
          'end': '2014-01-01',
          'summary': 'Design of Intelligent Protoplasma'
        }),
        AJAX.post('/candidates/me/picture', {
          'url': 'http://www.hackandcraft.com/'
        }),
      ]);
    });
  });
});


