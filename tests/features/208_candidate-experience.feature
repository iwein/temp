Feature: Candidate sign up with work experience
  This feature describes a candidate creating a work experience

  Background:
     Given I post a new candidate

  Scenario: Candidate should have no work experience
      When I invoke "/candidates/me/work_experience" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        []
        """

  Scenario: Candidate set work experience
      When I post to "/candidates/me/work_experience":
        """
        {
          "company": "Intel Corp.",
          "role": "Project Architect",
          "city": "ÜberSigourney Fanatastic Not Existing Town",
          "country_iso": "DE",
          "start": "2004-01-01",
          "summary": "Design of Intelligent Protoplasma"
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        {
          "end": null,
          "summary": "Design of Intelligent Protoplasma",
          "start": "2004-01-01",
          "country_iso": "DE",
          "skills": [],
          "company": "Intel Corp.",
          "role": "Project Architect",
          "city": "ÜberSigourney Fanatastic Not Existing Town"
        }
        """

  Scenario: Before position is set signup stage should be false
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "work_experience": false }
        """

  Scenario: After position is set signup stage should be updated
     Given I post to "/candidates/me/work_experience":
        """
        {
          "company": "Intel Corp.",
          "role": "Project Architect",
          "city": "ÜberSigourney Fanatastic Not Existing Town",
          "country_iso": "DE",
          "start": "2004-01-01",
          "summary": "Design of Intelligent Protoplasma"
        }
        """
      When I invoke "/candidates/me/signup_stage" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "work_experience": true }
        """

