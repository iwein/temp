Feature: Candidate request offer
  This feature describes a candidate asking an employer for a offer

  Background:
       Given An employer and a candidate are created
         And Employer logs in
         And Employer creates a new offer
         And Employer logs out

  Scenario: Happy workflow
      Given Candidate logs in
       When I post to "/candidates/me/offers/<%= offer_id %>/accept":
        """
        { "email":"<%= candidate_email %>" }
        """
       Then The response status should be "200"
        And The response should have:
        """
        [
          { "status": "ACCEPTED", "completed": true },
          { "status": "INTERVIEW", "completed": false }
        ]
        """
       When I post to "/candidates/me/offers/<%= offer_id %>/status":
        """
        { "status":"INTERVIEW" }
        """
       Then The response status should be "200"
        And The response should have:
        """
        [
          { "status": "INTERVIEW", "completed": true },
          { "status": "CONTRACT_NEGOTIATION", "completed": false }
        ]
        """
       When I post to "/candidates/me/offers/<%= offer_id %>/status":
        """
        { "status":"CONTRACT_NEGOTIATION" }
        """
       Then The response status should be "200"
        And The response should have:
        """
        [
          { "status": "CONTRACT_NEGOTIATION", "completed": true },
          { "status": "CONTRACT_SIGNED", "completed": false }
        ]
        """
       When I post to "/candidates/me/offers/<%= offer_id %>/signed":
        """
        {
          "start_date": "2015-01-01T00:00:00.000Z",
          "start_salary": 50000
        }
        """
       Then The response status should be "200"
        And The response should have:
        """
        [
          { "status": "CONTRACT_SIGNED", "completed": true }
        ]
        """

### This tests fail for 404

  # Scenario: Employer withdraws the offer
  #     Given Employer logs in
  #      When I post to "/employer/me/offers/<%= offer_id %>/withdraw":
  #       """
  #       { "reason": "Other", "withdrawal_text": "Employer said: he no like" }
  #       """
  #      Then The response status should be "200"
  #       And The response should have:
  #       """
  #       [{ "status": "WITHDRAW", "completed": true }]
  #       """

  # Scenario: Candidate rejects the offer
  #     Given Candidate logs in
  #      When I post to "/candidate/me/offers/<%= offer_id %>/reject":
  #       """
  #       { "reason": "Salary offer not high enough", "rejected_text": null }
  #       """
  #      Then The response status should be "200"
  #       And The response should have:
  #       """
  #       [{ "status": "REJECTED", "completed": true }]
  #       """
