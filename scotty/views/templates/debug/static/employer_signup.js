
var EMPLOYER_SIGNUP = function(email){
    return [
        {url: '/api/v1/employers/', title: 'employer-signup',
            data: {company_name: 'Bob Corp '+guid(), "email": email, pwd: "welcomepwd",
                contact_salutation: 'Mr',
                contact_first_name: 'Uncle',
                contact_last_name: 'Smith',
                company_type:'top500'
            },
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
                contact_salutation: 'Mrs',
                contact_first_name: 'Rob',
                contact_last_name: 'Stuart',
                fb_url: 'facebook url of employer',
                linkedin_url: 'linkedin url of employer'
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post1', method: 'GET'},



        {url: '/api/v1/employers/me/offices', method: "PUT", title: 'employer-edit-workflow-step-2',
        data: [{
            address_line1: "Schoenhauser Allee 105", address_zipcode: "08712",
            address_city: {'city': "Hamburg", country_iso: "DE"},
            contact_salutation: 'Mr',
            contact_first_name: 'Martha',
            contact_last_name: 'Stewart',
            contact_phone: "+49 232314 2435",
            contact_email: 'harald@kliockner.com'
        },
                {
            address_line1: "Schoenhauser Allee 106", address_zipcode: "08712",
            address_city: {'city': "Hamburg", country_iso: "DE"},
            contact_salutation: 'Mr',
            contact_first_name: 'Martha',
            contact_last_name: 'Stewart',
            contact_phone: "+49 232314 2435",
            contact_email: 'harald@kliockner.com'
        }]},

        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post2', method: 'GET'},


        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-3', method: 'PUT',
            data: {
                mission_text: 'A VERY LONG TEXT',
                founding_year: 2014,
                revenue_pa: 2000001,
                funding_amount: 5688,
                funding_text: "we received a lot of funding",
                no_of_employees: 43
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post3', method: 'GET'},

        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-4', method: 'PUT',
            data: {
                tech_team_size: 45,
                tech_team_philosophy: "We really love tech, that's why we call it lovingly tech.",
                tech_tags: ['PHP', 'Python', 'Java', 'Apache']
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post4', method: 'GET'},


        {url: '/api/v1/employers/me', title: 'employer-edit-workflow-step-5', method: 'PUT',
            data: {
                benefits: ['Coffee', 'Breakfasts', 'Massages', 'Dogs Allowed', 'Remote Work'],
                recruitment_process: "really long recruiting process definition",
                training_policy: "really long training description"
            }
        },
        {url: '/api/v1/employers/me/signup_stage', title: 'employer-edit-workflow-stage-post5', method: 'GET'},

        {url: '/api/v1/employers/me/apply', title: 'employer-edit-workflow-step-6', method: 'PUT',
            data: {agreedTos: true}
        }
    ]
};