Feature: Candidate sign up with target position
  This feature describes a candidate creating a target position

  Background:
     Given I post a new candidate

  Scenario: Candidate should have no target position
      When I invoke "/candidates/me/target_position" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        null
        """

  Scenario: Candidate set target position
      When I post to "/candidates/me/target_position":
        """
        {
          "company_types": ["startup", "top500"],
          "role": "Java Developer",
          "skills": ["Python", "PHP"],
          "relocate": true,
          "travel_willingness": ">50%",
          "minimum_salary": 100000
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        {
          "minimum_salary": 100000,
          "skills": [ "PHP", "Python" ],
          "role": "Java Developer"
        }
        """

  Scenario: Before position is set signup stage should be false
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "target_position": false }
        """

  Scenario: After position is set signup stage should be updated
     Given I post to "/candidates/me/target_position":
        """
        {
          "company_types": ["startup", "top500"],
          "role": "Java Developer",
          "skills": ["Python", "PHP"],
          "relocate": true,
          "travel_willingness": ">50%",
          "minimum_salary": 100000
        }
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "target_position": true }
        """

