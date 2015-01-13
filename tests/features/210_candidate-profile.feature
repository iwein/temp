Feature: Candidate sign up with profile completion
  This feature describes a candidate creating a profile completion

  Background:
     Given I post a new candidate

  Scenario: Candidate should have no profile completion
      When I invoke "/candidates/me/profile_completion" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        {
          "active": false,
          "availability": false,
          "summary": false
        }
        """

  Scenario: Candidate sets summary
      Given I put to "/candidates/me":
        """
        { "summary": "I'm a cool summary" }
        """
      When I invoke "/candidates/me/profile_completion" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        {
          "active": false,
          "availability": false,
          "summary": true
        }
        """

  Scenario: Candidate sets availability
      Given I put to "/candidates/me":
        """
        { "availability": "I'm a cool availability" }
        """
      When I invoke "/candidates/me/profile_completion" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        {
          "active": false,
          "availability": true,
          "summary": false
        }
        """
