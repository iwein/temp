Feature: Candidate sign up & log in behavior
  This feature describes a basic candidate executing operations to log in, log
  out and get '/me' endpoint which will return candidate's data if the user is
  logged in and 403 if there is no user logged in.


  Scenario: Candidate 'me' endpoint without user
      When I invoke "/candidates/me" endpoint
      Then The response status should be "403"

  Scenario: Candidate simplest signup
      When I post a new candidate
      Then The response status should be "200"
       And The response should have:
        """
        { "email": "<%= candidate_email %>" }
        """

  Scenario: Candidate 'me' endpoint after signup
     Given I post a new candidate
      When I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "email": "<%= candidate_email %>" }
        """

  Scenario: Candidate logout
     Given I post a new candidate
      When Candidate logs out
       And I invoke "/candidates/me" endpoint
      Then The response status should be "403"

  Scenario: Candidate login
     Given I post a new candidate
       And Candidate logs out
      When Candidate logs in
      Then The response status should be "200"
       And The response should have:
        """
        { "preferred": "candidate" }
        """

  Scenario: Candidate 'me' endpoint after login
     Given I post a new candidate
       And Candidate logs out
      When Candidate logs in
       And I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        { "email": "<%= candidate_email %>" }
        """

  Scenario: Candidate set extra parameters
     Given I post a new candidate
      When I put to "/candidates/me":
        """
        {
          "eu_work_visa": true,
          "location": {
            "country_iso": "ES",
            "city": "Barcelona"
          },
          "dob": "1975-06-05T15:32:41.878Z",
          "github_url": "http://localhost/static/apps/candidate/#/signup/profile/",
          "stackoverflow_url": "http://localhost/static/apps/candidate/#/signup/profile/",
          "blog_url": "http://localhost/static/apps/candidate/#/signup/profile/"
        }
        """
       And I invoke "/candidates/me" endpoint
      Then The response status should be "200"
       And The response should have:
        """
        {
          "eu_work_visa": true,
          "location": {
            "country_iso": "ES",
            "city": "Barcelona"
          },
          "dob": "1975-06-05",
          "github_url": "http://localhost/static/apps/candidate/#/signup/profile/",
          "stackoverflow_url": "http://localhost/static/apps/candidate/#/signup/profile/",
          "blog_url": "http://localhost/static/apps/candidate/#/signup/profile/"
        }
        """

  Scenario: Candidate is approved by admin
      Given I post a new candidate
       When Candidate is approved
       Then The response status should be "200"

  # Disabled because there is no way to retrieve activation code from client
  # Scenario: Candidate activation
  #    Given I post a new candidate
