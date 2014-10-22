Feature: Basic candidate behaviour
  Some description


  Scenario: Candidate signup
      When I post a new candidate
      Then The response status should be "200"
       And The response should have candidate's email on "email" field


  Scenario: Candidate 'me' endpoint
     Given I post a new candidate
      When I invoke "/candidates/me" endpoint
      Then The response status should be "403"


  Scenario: Candidate login
     Given I post a new candidate
      When Candiate logs in
      Then The response status should be "200"
       And The response should have candidate's email on "email" field


  Scenario: Candidate 'me' endpoint after login
     Given I post a new candidate
       And Candiate logs in
      When I invoke "/candidates/me" endpoint
#      And I do other stuff
      Then The response status should be "200"
       And The response should have candidate's email on "email" field
#      But The response don't have something else
