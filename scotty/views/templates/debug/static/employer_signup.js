
var EMPLOYER_SIGNUP = function(email){
    return [
        {url: '/api/v1/employers/', title: 'employer-signup',
            data: {company_name: 'Bob Corp '+guid(), "email": email, pwd: "welcomepwd", 'contact_name': 'Uncle Bob'},
            extract: function (r, extr) {
                return {employerId: r.id}
            }},

        {url: '/api/v1/employers/login', title: 'employer-login', data: {"email": email, pwd: "welcomepwd"}},

        {url: '/api/v1/employers/me', title: 'employer-get-me'},
        {url: function (r, extr) {return '/api/v1/employers/' + extr.employerId}, title: 'employer-get-by-id'},

        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-pre1', method: 'GET'},
        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-1', method: 'PUT',
            data: {
                logo_url: 'http://logo_url.com',
                website: "http://website.com",
                address_line1: "line 1 of address",
                address_line2: "line 2 of address",
                address_line3: "line 3 of address",
                address_zipcode: "zipcode of address",
                address_city: {city: 'Dresden', country_iso: 'DE'},

                contact_name: 'name of contact',
                contact_phone: 'phone of contact',
                contact_email: 'email of contact',
                contact_position: 'position of contact',

                fb_url: 'facebook url of employer',
                linkedin_url: 'linkedin url of employer'
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post1', method: 'GET'},

        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-2', method: 'PUT',
            data: {mission_text: 'A VERY LONG TEXT'}
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post2', method: 'GET'},

        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-3', method: 'PUT',
            data: {
                founding_year: 2014,
                revenue_pa: 2000001,
                funding_amount: 5688,
                funding_text: "we received a lot of funding",
                no_of_employees: 43,
                tech_team_size: 45,
                tech_tags: ['PHP', 'Python', 'Java', 'Apache']
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post3', method: 'GET'},


        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-4', method: 'PUT',
            data: {
                benefits: ['Coffee', 'Breakfasts', 'Massages', 'Dogs Allowed', 'Remote Work'],
                recruitment_process: "really long recruiting process definition",
                training_policy: "really long training description"
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post4', method: 'GET'},

        {url: '/api/v1/employers/me/apply', title: 'employer-edit-workflow-step-5', method: 'PUT',
            data: {agreedTos: true}
        }
    ]
};