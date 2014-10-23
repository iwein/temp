Feature: Candidate sign up
  This feature describes a candidate


  Background:
     Given I post a new candidate

  Scenario: Candidate set photo url
      When I post to "/candidates/me/picture":
        | url | http://www.hackandcraft.com/ |
      Then The response status should be "200"
       And The response should have the property:
        | picture_url | http://www.hackandcraft.com/ |

