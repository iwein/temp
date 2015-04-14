Feature: Candidate signup step 'profile'

  Background:
     Given I post a new candidate

  Scenario: Before data is set signup stage should be false
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "dob": false }
        """

  Scenario: Candidate should have no date of birth
      When I get "/candidates/me"
      Then The response status should be "200"
       And The response should have:
        """
        { "dob": { "$exists": false } }
        """

  # Scenario: Candidate can't set a date of birth smaller than 16 years ago
  #     When I put to "/candidates/me":
  #       """
  #       { "dob": "<%= year %>-01-01" }
  #       """
  #     Then The response status should be "400"

  Scenario: Candidate set work experience
      When I put to "/candidates/me":
        """
        {
          "dob": "1990-01-01",
          "location": {
            "country_iso": "DE",
            "city": "Berlin"
          }
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        {
          "dob": "1990-01-01",
          "location": {
            "country_iso": "DE",
            "city": "Berlin"
          }
        }
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "dob": true }
        """
