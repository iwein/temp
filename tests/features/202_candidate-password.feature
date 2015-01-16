Feature: Candidate forgot password & password reset

  Background:
     Given I post a new candidate
       And Candidate logs out

  Scenario: Candidate request a password reset
      When Candidate request a password reset
      Then The response status should be "200"
       And The response should have:
        """
        { "success": true }
        """

  Scenario: Check if reset password token is valid
     Given Candidate request a password reset
      When Candidate validates password token
      Then The response status should be "200"
       And The response should have:
        """
        { "success": true }
        """

  Scenario: Candidate post a new password
     Given Candidate request a password reset
      When Candidate resets password to "321321321"
      Then The response status should be "200"
       And The response should have:
        """
        { "success": true }
        """
