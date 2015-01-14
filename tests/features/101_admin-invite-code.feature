Feature: Invite code behaviour

  Scenario: Admin creates a new invitation code
      When I create an invitation code
      Then The response status should be "200"
       And The response should have:
        """
        { "code": { "$value": "invite_code" } }
        """

  Scenario: Admin retrieves invitation code's list
     Given I create an invitation code
      When I list invite codes
      Then The response status should be "200"
       And The response should have:
        """
        {
          "pagination": {},
          "data": []
        }
        """

# Disabled for now, because the new code can be after pagination
#          "data": [{ "code": { "$value": "invite_code" } }]

  Scenario: Candidate signup with invitation code
     Given I create an invitation code
      When I post a new candidate with invitation code
      Then The response status should be "200"
       And The response should have:
        """
        {
          "email": { "$value": "candidate_email" },
          "invite_code": {
            "code": { "$value": "invite_code" }
          }
        }
        """
