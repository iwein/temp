Feature: Employer sign up process
  This feature describes a employer searching for candidates

  Background:
       Given I create a complete employer
         And Employer is approved
         And I create a complete candidate
         And Candidate is approved

  Scenario: Simple skill search
       When I get "/candidates/?q=Python"
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": {}, "data": [{
          "skills": [{ "skill": "Python" }]
        }] }
        """

  Scenario: Simple name search
       When I get "/candidates/?q=Bob"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{ "first_name": "Bob" }]
        }
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

