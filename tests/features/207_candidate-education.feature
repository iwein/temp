Feature: Candidate sign up with education
  This feature describes a candidate creating a education

  Background:
     Given I post a new candidate

  Scenario: Before position is set signup stage should be false
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "education": false }
        """

  Scenario: Candidate should have no education
      When I invoke "/candidates/me/education" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        []
        """

  Scenario: Candidate set education
      When I post to "/candidates/me/education":
        """
        {
          "institution":"Eidgenössische Technische Hochschule Zürich, Switzerland",
          "degree":"NEWDEGREE-2fbb080a-df19-79b6-d62a-edd989efcee0",
          "start":1992,
          "course":"Programming"
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        {
          "start": 1992,
          "degree": "NEWDEGREE-2fbb080a-df19-79b6-d62a-edd989efcee0",
          "institution": "Eidgenössische Technische Hochschule Zürich, Switzerland",
          "end": null,
          "course": "Programming"
        }
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "education": true }
        """

