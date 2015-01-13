Feature: Employer sign up & log in behavior
  This feature describes a basic employer executing operations to log in, log
  out and get '/me' endpoint which will return employer's data if the user is
  logged in and 403 if there is no user logged in.

  Scenario: Employer 'me' endpoint without user
      When I invoke "/employers/me" endpoint
      Then The response status should be "403"

  Scenario: Employer simplest signup
      When I post a new employer
      Then The response status should be "200"

  Scenario: Employer 'me' endpoint after signup
     Given I post a new employer
      When I invoke "/employers/me" endpoint
      Then The response status should be "200"
       And The response should have employer's email on "email" field

  Scenario: Employer logout
     Given I post a new employer
      When Employer logs out
       And I invoke "/employers/me" endpoint
      Then The response status should be "403"

  Scenario: Employer login
     Given I post a new employer
       And Employer logs out
      When Employer logs in
      Then The response status should be "200"
       And The response should have:
        """
        { "preferred": "employer" }
        """

  Scenario: Employer 'me' endpoint after login
     Given I post a new employer
       And Employer logs out
      When Employer logs in
       And I invoke "/employers/me" endpoint
      Then The response status should be "200"
       And The response should have employer's email on "email" field
