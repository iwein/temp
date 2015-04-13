Feature: Candidate sign up with picture
  This feature describes a candidate


  Background:
     Given I post a new candidate

  Scenario: Candidate set photo url
      When I post to "/candidates/me/picture":
        """
        { "url": "http://www.hackandcraft.com/" }
        """
      Then The response status should be "200"
       And The response should have:
       """
       { "picture_url": "http://www.hackandcraft.com/" }
       """

  Scenario: Candidate get photo url
     Given I post to "/candidates/me/picture":
        """
        { "url": "http://www.hackandcraft.com/" }
        """
      When I invoke "/candidates/me" endpoint
      Then The response should have:
       """
       { "picture_url": "http://www.hackandcraft.com/" }
       """
