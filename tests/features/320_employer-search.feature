Feature: Employer sign up process
  This feature describes a employer searching for candidates

  Background:
       Given An employer and a candidate are created
         And Employer logs in

  Scenario: Not logged in employer should not be able to search
       When Employer logs out
        And I get "/candidates/?q=Python"
       Then The response status should be "403"

  Scenario: Simple name search
       When I get "/candidates/?q=<%= candidate_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": { "total": 1 },
          "data": [{ "first_name": "<%= candidate_name %>" }]
        }
        """

  Scenario: Simple skill search
       When I get "/candidates/?q=Python"
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": {}, "data": [{
          "skills": [{ "skill": "Python" }]
        }] }
        """

  Scenario: Advanced search by role
       When I post to "/candidates/advancedsearch":
        """
        { "role": "System Administration" }
        """
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{
            "target_position": { "role": "System Administration" }
          }]
        }
        """

  Scenario: Advanced search by skill
       When I post to "/candidates/advancedsearch":
        """
        { "skills": [ "Python" ] }
        """
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": {}, "data": [{
          "skills": [{ "skill": "Python" }]
        }] }
        """

  Scenario: Advanced search by salary
       When I post to "/candidates/advancedsearch":
        """
        { "salary": "50000" }
        """
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": {}, "data": [] }
        """

  Scenario: Advanced search by city
       When I post to "/candidates/advancedsearch":
        """
        {
          "locations": [{
            "city": "Berlin",
            "country_iso": "DE"
          }]
        }
        """
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{
            "preferred_location": { "DE": [] }
          }]
        }
        """

  Scenario: Advanced search with all parameters set
       When I post to "/candidates/advancedsearch":
        """
        {
          "role": "System Administration",
          "skills": [ "Python" ],
          "salary": "50000",
          "locations": [{
            "city": "Berlin",
            "country_iso": "DE"
          }]
        }
        """
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{
            "target_position": { "role": "System Administration" },
            "preferred_location": { "DE": [] },
            "skills": [{ "skill": "Python" }]
          }]
        }
        """

### Test disabled because it fails

  # Scenario: Search anonymous candidate by skill
  #     Given Candidate wants to be anonymous
  #      When I get "/candidates/?q=<%= unique_skill %>"
  #      Then The response status should be "200"
  #       And The response should have:
  #       """
  #       { "pagination": {}, "data": [{
  #         "$not": { "first_name": "<%= candidate_name %>" }
  #       }] }
  #       """

  Scenario: Simple name search for anonymous candidate
      Given Candidate wants to be anonymous
       When I get "/candidates/?q=<%= candidate_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": { "total": 0 },
          "data": []
        }
        """

  Scenario: Simple name search for anonymous candidate who has accepted an offer
      Given Candidate wants to be anonymous
        And Employer creates a new offer
        And Candidate logs in
        And I post to "/candidates/me/offers/<%= offer_id %>/accept":
        """
        { "email":"<%= candidate_email %>" }
        """
        And Employer logs in
       When I get "/candidates/?q=<%= candidate_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{
            "id": "<%= candidate_id %>",
            "first_name": "<%= candidate_name %>"
          }]
        }
        """

  Scenario: Employer search his current employee
        And Candidate logs in
        And I post to "/candidates/me/work_experience":
        """
        {
          "company": "<%= company_name %>",
          "role": "Project Architect",
          "city": "ÜberSigourney Fanatastic Not Existing Town",
          "country_iso": "DE",
          "start": "2014-01-01",
          "summary": "Design of Intelligent Protoplasma"
        }
        """
        And Employer logs in
       When I get "/candidates/?q=<%= candidate_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": { "total": 0 },
          "data": []
        }
        """

