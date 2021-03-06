Feature: Candidate sign up with preferred cities
  This feature describes a candidate creating a preferred cities

  Background:
     Given I post a new candidate

  Scenario: Candidate set preferred cities
      When I put to "/candidates/me/preferred_locations":
        """
        {
          "DE": ["Berlin","Leipzig","Hamburg"],
          "BR": ["Uberlândia"]
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        { "preferred_location": {
          "DE": ["Berlin","Leipzig","Hamburg"],
          "BR": ["Uberlândia"]
        } }
        """

  Scenario: Candidate set preferred cities to a entire country
      When I put to "/candidates/me/preferred_locations":
        """
        {
          "DE": [],
          "BR": null
        }
        """
      Then The response status should be "200"
       And The response should have:
        """
        { "preferred_location": {
          "DE": [],
          "BR": []
        } }
        """
