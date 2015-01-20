Feature: Employer sign up process
  This feature describes a candidate searching for employers

  Background:
       Given An employer and a candidate are created
         And Candidate logs in

  Scenario: Not approved employer should not be shown
      Given I create a complete employer
        And Employer logs out
        And Candidate logs in
       When I get "/employers/?company=<%= company_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": { "total":0 }, "data": [] }
        """

  Scenario: Search by technologies
       When I get "/employers/?tags=Python"
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": {}, "data": [{
          "tech_tags": [ "Python" ]
        }] }
        """

  Scenario: Search by company name
       When I get "/employers/?company=<%= company_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        { "pagination": {}, "data": [{
          "company_name": "<%= company_name %>"
        }] }
        """

  Scenario: Search by country (requires skill search)
       When I get "/employers/?city=Berlin&country_iso=DE&tags=Python"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{
            "tech_tags": [ "Python" ],
            "offices": [{
              "address_city": {
                "country_iso": "DE",
                "city": "Berlin"
              }
            }]
          }]
        }
        """

  Scenario: Search by all possible parameters
       When I get "/employers/?city=Berlin&country_iso=DE&tags=Python&company=<%= company_name %>"
       Then The response status should be "200"
        And The response should have:
        """
        {
          "pagination": {},
          "data": [{
            "tech_tags": [ "Python" ],
            "company_name": "<%= company_name %>",
            "offices": [{
              "address_city": {
                "country_iso": "DE",
                "city": "Berlin"
              }
            }]
          }]
        }
        """
