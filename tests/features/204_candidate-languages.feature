Feature: Candidate sign up with languages
  This feature describes a candidate creating a languages

  Background:
     Given I post a new candidate

  Scenario: Candidate should have no languages
      When I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "languages": [] }
        """

  Scenario: Candidate set languages
      When I put to "/candidates/me/languages":
        """
        [
          { "language": "German", "proficiency": "native" },
          { "language": "English", "proficiency": "advanced" },
          { "language": "French", "proficiency": "basic" }
        ]
        """
       And I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "languages": [
          { "language": "German", "proficiency": "native" },
          { "language": "English", "proficiency": "advanced" },
          { "language": "French", "proficiency": "basic" }
        ] }
        """

  Scenario: Before languages are set signup stage should be false
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "languages": false }
        """

  Scenario: After languages are set signup stage should be updated
     Given I put to "/candidates/me/languages":
        """
        [
          { "language": "German", "proficiency": "native" },
          { "language": "English", "proficiency": "advanced" },
          { "language": "French", "proficiency": "basic" }
        ]
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "languages": true }
        """

