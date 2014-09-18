
var CANDIDATE_SIGNUP = function(email){
    return [{url:'/api/v1/candidates/', title: 'candidate-signup',
        data: {first_name: 'Bob', last_name: "Bayley", "email": email, pwd:"welcomepwd"},
        extract:   function(r, extr){return {candidateId: r.id, actToken: r.activation_token}}},

        {url:function(r, extr){ return '/api/v1/candidates/activate/'+extr.actToken;}, title: 'candidate-activation'},

        {url: function(r, extr){return '/api/v1/candidates/login'}, title: 'candidate-login',
            data: {"email": email, pwd:"welcomepwd"}
        }
    ];
};


var CANDIDATE_COMPLETE_PROFILE = function(email) {
    return [
        {url: function(r, extr){return '/api/v1/candidates/me/target_positions'}, title: 'create-target_position',
            data: {"company_types": ["startup"], "role":"Java Developer", 'skill': "PHP",
                benefits:"Free Breakfasts", minimum_salary: 100000},
            extract:   function(r, extr){return {target_positionId: r.id}}},

        {url: function(r, extr){return '/api/v1/candidates/me/languages'},
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
        }},
        {url: function(r, extr){return '/api/v1/candidates/me/preferred_cities'},
            title: 'set-candidate-preferred_cities-1', method:'PUT', data: [
            {'city':'Berlin', 'country_iso': 'DE'},
            {'city':'Leipzig', 'country_iso': 'DE'},
            {'city':'Hamburg', 'country_iso': 'DE'},
            {'city':'Uberlândia', 'country_iso': 'BR'}]},
        {url: function(r, extr){return '/api/v1/candidates/me/education'}, title: 'create-education',
            data: {"institution": "Eidgenössische Technische Hochschule Zürich, Switzerland", "degree":"Bachelor",
                "start":"1999-01-01", "end": "2002-03-31", course:"Design of Intelligent Protoplasma"},
            extract:   function(r, extr){return {educationId: r.id}}},
        {url: function(r, extr){return '/api/v1/candidates/me/work_experience'}, title: 'create-work_experience',
            data: {"company": "Intel Corp.", "role":"Project Architect",
                location: {"city": "Überlingen", country_iso: 'DE'}, "start":"2004-01-01", "end": "2004-03-31", summary:"Design of Intelligent Protoplasma"},
            extract:   function(r, extr){return {work_experienceId: r.id}}},
    ];
}