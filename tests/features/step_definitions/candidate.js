// This addStepDefinitions() function is why the step definitions must
// be configured to load after the adapter.
addStepDefinitions(function (scenario) {
  // Before scenario hooks
  scenario.Before(function (callback) {
    callback();
  });

  function generateEmail() {
    return 'catch+candidate-' + guid() + '@hackandcraft.com';
  }

  var email, lastResponse;


  scenario.When(/^I post a new candidate$/, function(callback) {
    console.log('CACA');
    email = generateEmail();

    AJAX.post('/candidates/', {
      "email": email,
      "pwd": "welcomepwd",
      "first_name": "Bob",
      "last_name": "Bayley",
    }).then(function(response) {
      console.log('superpolla');
      lastResponse = response;
      callback();
    });
  });

  scenario.Then(/^The response should have candidate's email on "([^"]*)" field$/, function(key, callback) {
    console.log('POLLAMAN');
    assert(lastResponse[key], 'Field not found');
    assert(lastResponse[key] === 'POLLA', 'Email is not expected')
  });

  // After scenario hooks
  scenario.After(function (callback) {
    callback();
  });
});


