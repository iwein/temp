Feature: Employer sign up process
  This feature describes a employer moving though signup process

  Background:
       Given I post a new employer

  Scenario: I post my basic info
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step1": false }
        """
       When I put to "/employers/me":
        """
        {
          "website": "http://localhost/static/apps/employer/#/signup/basic/",
          "fb_url": "http://localhost/static/apps/employer/#/signup/basic/",
          "linkedin_url": "http://localhost/static/apps/employer/#/signup/basic/",
          "logo_url": "https://s3-eu-west-1.amazonaws.com/scotty-dev/logo/21064839-3bce-4a37-9124-6c2644e9af95"
        }
        """
       Then The response status should be "200"
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step1": true }
        """

  Scenario: I post company's facts
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step3": false }
        """
       When I put to "/employers/me":
        """
        {
          "funding_year": 1931,
          "no_of_employees": 2008,
          "revenue_pa": 43420,
          "mission_text": "336b6c2d-8663-7eac-d8a4-b57570bc0dd4"
        }
        """
       Then The response status should be "200"
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step3": true }
        """

  Scenario: I post tech facts
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step4": false }
        """
       When I put to "/employers/me":
        """
        {
          "tech_tags": ["asdf", "Python"],
          "tech_team_philosophy": "338b32a1-e460-367d-900a-68fb8c441f09",
          "tech_team_size": 2003
        }
        """
       Then The response status should be "200"
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step4": true }
        """

  Scenario: I post tos acceptance
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step6": false }
        """
       When I put to "/employers/me/apply":
        """
        { "agreedTos":true }
        """
       Then The response status should be "200"
       When I get "/employers/me/signup_stage"
       Then The response status should be "200"
        And The response should have:
        """
        { "step6": true }
        """
