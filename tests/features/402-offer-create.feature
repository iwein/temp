Feature: Candidate request offer
  This feature describes a candidate asking an employer for a offer

  Background:
       Given An employer and a candidate are created
         And Employer logs in

  Scenario: Employer retrieves employer profile
       When I get "/candidates/<%= candidate_id %>"
       Then The response status should be "200"
        And The response should have:
        """
        { "id": "<%= candidate_id %>" }
        """

  Scenario: Employer creates a offer to the current candidate
       When Employer creates a new offer
       Then The response status should be "200"
        And The response should have:
        """
        { "candidate": { "id": "<%= candidate_id %>" } }
        """
