Feature: Basic candidate behaviour
  Some description


  Scenario: Candidate signup
    When I post a new candidate
    Then The response should have candidate's email on "email" field
