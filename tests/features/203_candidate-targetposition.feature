Feature: Candidate sign up with target position
  This feature describes a candidate creating a target position

  Background:
     Given I post a new candidate

  Scenario: Candidate set target position
      When I post to "/candidates/me/target_position":
        """
        {
          "role": "System Administration",
          "skills": ["Python", "PHP"],
          "minimum_salary": 40000
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        {
          "role": "System Administration",
          "skills": [ "PHP", "Python" ],
          "minimum_salary": 40000
        }
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "target_position": true }
        """
