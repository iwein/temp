Feature: Basic candidate behaviour
  Some description


  Scenario: Candidate 'me' endpoint without user
      When I invoke "/candidates/me" endpoint
      Then The response status should be "403"

  Scenario: Candidate signup
      When I post a new candidate
      Then The response status should be "200"
       And The response should have candidate's email on "email" field

  Scenario: Candidate 'me' endpoint after signup
     Given I post a new candidate
      When I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have candidate's email on "email" field

  Scenario: Candidate logout
     Given I post a new candidate
      When Candiate logs out
       And I invoke "/candidates/me" endpoint
      Then The response status should be "403"

  Scenario: Candidate login
     Given I post a new candidate
       And Candiate logs out
      When Candiate logs in
      Then The response status should be "200"
       And The response should have candidate's email on "email" field

  Scenario: Candidate 'me' endpoint after login
     Given I post a new candidate
       And Candiate logs out
      When Candiate logs in
       And I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have candidate's email on "email" field
#      But The response don't have something else
