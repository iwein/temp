Feature: Candidate request offer
  This feature describes a candidate asking an employer for a offer

  Background:
       Given I create a complete employer
         And Employer is approved
         And I create a complete candidate
         And Candidate is approved

  Scenario: Candidate retrieves employer profile
       When I get "/employers/<%= employer_id %>"
       Then The response status should be "200"
        And The response should have:
        """
        { "id": "<%= employer_id %>" }
        """

  Scenario: Candidate request a offer from the employer
       When I post to "/candidates/me/bookmarks":
        """
        { "id": "<%= employer_id %>" }
        """
       Then The response status should be "200"
       When I get "/candidates/me/bookmarks"
       Then The response status should be "200"
        And The response should have:
        """"
        [{
          "id": "<%= employer_id %>",
          "email": "<%= employer_email %>",
          "company_name": "<%= company_name %>"
        }]
        """

  Scenario: Employer should see candidates than requested an offer
      Given I post to "/candidates/me/bookmarks":
        """
        { "id": "<%= employer_id %>" }
        """
        And Candidate logs out
        And Employer logs in
       When I get "/employers/me/interestedcandidates"
       Then The response status should be "200"
        And The response should have:
        """
        [{ "id": "<%= candidate_id %>" }]
        """

