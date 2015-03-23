Feature: Employer sign up process - offices step
  This feature describes a employer moving though signup process

  Background:
       Given I post a new employer

  Scenario: Company has a head quarter
       When I put to "/employers/me/offices":
        """
        [{
          "contact_first_name": "Martha",
          "contact_last_name": "Stewart",
          "contact_salutation": "Mr",
          "contact_email": "<%= employer_email %>",
          "address_city": {
            "country_iso": "DE",
            "city": "Berlin"
          },
          "address_line1": "Schoenhauser Allee 106",
          "address_zipcode": "08712",
          "contact_phone": "+49 232314 2435"
        }]
        """
       Then The response status should be "200"
        And The response should have:
        """
        [{ "contact_email": "<%= employer_email %>" }]
        """
