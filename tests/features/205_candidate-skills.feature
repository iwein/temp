Feature: Candidate sign up with skills
  This feature describes a candidate creating a skills

  Background:
     Given I post a new candidate

  Scenario: Candidate should have no skills
      When I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "skills": [] }
        """

  Scenario: Candidate set skills
      When I put to "/candidates/me/skills":
        """
        [
          { "skill": "Python", "level": "basic" },
          { "skill": "PHP", "level": "advanced" },
          { "skill": "Java", "level": "advanced" },
          { "skill": "SingStar" },
          { "skill": "SegaGames", "level": null },
          { "skill": "Spring", "level": "expert" }
        ]
        """
       And I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "skills": [
          { "skill": "Python", "level": "basic" },
          { "skill": "PHP", "level": "advanced" },
          { "skill": "Java", "level": "advanced" },
          { "skill": "SingStar" },
          { "skill": "SegaGames" },
          { "skill": "Spring", "level": "expert" }
        ] }
        """

  Scenario: Before skills are set signup stage should be false
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "skills": false }
        """

  Scenario: After skills are set signup stage should be updated
     Given I put to "/candidates/me/skills":
        """
        [
          { "skill": "Python", "level": "basic" },
          { "skill": "PHP", "level": "advanced" },
          { "skill": "Java", "level": "advanced" },
          { "skill": "SingStar" },
          { "skill": "SegaGames", "level": null },
          { "skill": "Spring", "level": "expert" }
        ]
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "skills": true }
        """

