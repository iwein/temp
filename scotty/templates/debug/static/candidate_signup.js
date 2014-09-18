
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