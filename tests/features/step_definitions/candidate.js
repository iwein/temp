/* globals stepDefinitions, AJAX */

stepDefinitions(function(scenario) {
  /*jshint validthis:true */
  'use strict';

  scenario.Before(function() {
    return AJAX.get('/candidates/logout', {}, { log: false })
      // if logout fails doesn't mean the test is failed
      // so we catch it and pass
      .catch(function() { });
  });

  function postCandidate(modifier) {
    var vars = this.vars;
    vars.candidate_name = 'test-candidate-' + this.guid();
    vars.candidate_email = this.generateEmail();

    return this.storeRequest(AJAX.post('/candidates/', {
      target_position: {
        'role': 'System Administration',
        'skills': ['Python', 'PHP'],
        'minimum_salary': 40000
      },
      preferred_locations: {
        'DE': ['Berlin','Leipzig','Hamburg'],
        'BR': ['Uberlândia']
      }
    }).then(function(response) {
      var id = response.responseJSON.id;
      var data = {
        'email': vars.candidate_email,
        'pwd': 'Überfall',
        'first_name': vars.candidate_name,
        'last_name': 'Bayley',
        'agreedTos': true,
      };

      if (modifier)
        data = modifier(vars, data);

      return AJAX.post('/candidates/' + id, data);
    })).then(function(response) {
      vars.candidate_id = response.id;
      console.log('Created candidate:', vars.candidate_id);
      return response;
    });
  }

  scenario.When(/^I post a new candidate$/, postCandidate);

  scenario.Given(/^I post a new candidate with invitation code$/, function() {
    return postCandidate.call(this, function(vars, data) {
      data.invite_code = vars.invite_code;
      return data;
    });
  });

  scenario.Given(/^I create a complete candidate$/, function() {
    return scenario.step(/^I post a new candidate$/).then(function() {
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
          { 'skill': this.vars.unique_skill, 'level': 'expert' },
          { 'skill': 'Python', 'level': 'basic' },
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
    }.bind(this));
  });

  scenario.Given(/^Candidate logs in$/, function() {
    return this.storeRequest(AJAX.post('/login', 'pwd=Überfall&email=' +
      encodeURIComponent(this.vars.candidate_email)));
  });

  scenario.Given(/^Candidate logs out$/, function() {
    return this.storeRequest(AJAX.get('/candidates/logout'));
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

  scenario.Given(/^Candidate wants to be anonymous$/, function() {
    return scenario.step(/^Candidate logs in$/).then(function() {
      return AJAX.put('/candidates/me', { 'anonymous': true });
    }).then(function() {
      return scenario.step(/^Employer logs in$/);
    });
  });
});


