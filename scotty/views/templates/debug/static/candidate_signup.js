
var CANDIDATE_SIGNUP = function (email, ignoreResult){
  return [

    {url:'/api/v1/candidates/', title: 'candidate-email-signup', ignoreResult: ignoreResult,
      data: {first_name: 'Bob', last_name: "Bayley", "email": email, pwd:"welcomepwd", agreedTos: true},
      extract:   function(r, extr){return {candidateId: r.id, actToken: r.activation_token}}},
    {url: '/api/v1/candidates/me/target_position', title: 'signup-target_position', method:"PUT",
      data: {"role":"Software Development (general)", "skills": ["Python", "PHP"], minimum_salary: 40000}
    },

    {url:function(r, extr){ return '/api/v1/candidates/activate/'+extr.actToken;}, ignoreResult:ignoreResult, title: 'candidate-activation'},
    {url: function(r, extr){return '/api/v1/candidates/login'}, title: 'candidate-login', ignoreResult:ignoreResult,
      data: {"email": email, pwd:"welcomepwd"}
    }
  ];
};


var CANDIDATE_COMPLETE_PROFILE = function(email, ignoreResult) {
  return [
    {url: function(r, extr){return '/api/v1/candidates/me/target_position'}, title: 'EDIT-target_position', method:"PUT",
      data: {"company_types": ["startup", "top500"],
        "role":"Quality Assurance",
        'skills': ["Python", "PHP"], relocate: false,
        travel_willingness:'<10%', minimum_salary: 100000}, ignoreResult:ignoreResult},

    {url: function(r, extr){return '/api/v1/candidates/me/languages'}, ignoreResult:ignoreResult,
      title: 'set-languages-1', method:'PUT', data: [
      {'language':'English', 'proficiency': 'advanced'},
      {'language':'German', 'proficiency': 'native'},
      {'language':'French', 'proficiency': 'basic'}
    ]},

    {url: function (r, extr) {
      return '/api/v1/candidates/me/skills'
    }, title: 'set-skills', method: 'PUT', data: [
      {"skill": "PHP", "level": "advanced"},
      {"skill": "Java", "level": "advanced"},
      {"skill": "Python", "level": "basic"},
      {"skill": "Spring", "level": "expert"}
    ], extract: function (r, extr) {
      return {skillId: r.id}
    }, ignoreResult:ignoreResult},
    {url: function(r, extr){return '/api/v1/candidates/me/preferred_locations'},
      title: 'set-preferred_locations-1', method:'PUT',
      data: {DE: ['Berlin', 'Leipzig'], BR: ['Uberlândia']}, ignoreResult:ignoreResult},
    {url: function(r, extr){return '/api/v1/candidates/me/education'}, title: 'create-education', ignoreResult:ignoreResult,
      data: {"institution": "Eidgenössische Technische Hochschule Zürich, Switzerland", "degree":null,
        "start":1999, course:"Design of Intelligent Protoplasma"},
      extract:   function(r, extr){return {educationId: r.id}}},
    {url: function(r, extr){return '/api/v1/candidates/me/work_experience'}, title: 'create-work_experience', ignoreResult:ignoreResult,
      data: {"company": "Intel Corp.", "role":"Project Architect",
        "city": "ÜberSigourney Fanatastic Not Existing Town", country_iso: 'DE',
        "start":"2004-01-01", summary:"Design of Intelligent Protoplasma"},
      extract:   function(r, extr){return {work_experienceId: r.id}}},
  ];
};