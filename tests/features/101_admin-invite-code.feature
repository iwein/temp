Feature: Invite code behaviour

  Scenario: Admin creates a new invitation code
      When I create an invitation code
      Then The response status should be "200"
       And The response should have invitation code

  Scenario: Admin retrieves invitation code's list
     Given I create an invitation code
      When I invoke "/admin/invite_codes" endpoint
      Then The response status should be "200"
       And The response should be a list
       And Each item should have fields:
         | code | string |

  Scenario: Candidate signup with invitation code
     Given I create an invitation code
      When I post a new candidate with invitation code
      Then The response status should be "200"
       And The response should have candidate's email on "email" field
       And The response should have invitation code
