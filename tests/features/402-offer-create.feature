Feature: Candidate request offer
  This feature describes a candidate asking an employer for a offer

  Background:
       Given I create a complete candidate
         And Candidate is approved
         And I create a complete employer
         And Employer is approved

  Scenario: Employer retrieves employer profile
       When I get "/candidates/<%= candidate_id %>"
       Then The response status should be "200"
        And The response should have:
        """
        { "id": "<%= candidate_id %>" }
        """

  Scenario: Employer creates a offer to the current candidate
       When I post to "/employers/me/offers":
        """
        {
          "candidate": {
            "id": "<%= candidate_id %>"
          },
          "location": {
            "city": "Berlin",
            "country_iso": "DE"
          },
          "benefits": ["Coffee", "Massages"],
          "technologies": ["PHP", "Python"],
          "role": "Senior Artchitect",
          "annual_salary": 50000,
          "message": "Hi There, we like you, so we make this offer to you",
          "interview_details": "We will interview you",
          "job_description": "You will work for us"
        }
        """
       Then The response status should be "200"
        And The response should have:
        """
        { "candidate": { "id": "<%= candidate_id %>" } }
        """
