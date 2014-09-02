/*globals jasmine */
'use strict';

var baseUrl = 'http://' + (process.env.HTTP_HOST || 'localhost') +
							':' + (process.env.HTTP_PORT || '8081');

exports.config = {
	baseUrl: baseUrl,
	seleniumAddress: process.env.SELENIUM_URL || 'http://localhost:4444/wd/hub',
  //seleniumServerJar: 'node_modules/protractor/bin/webdriver-manager',

  capabilities: {
    'browserName': process.env.TEST_BROWSER_NAME || 'chrome',
    'version': process.env.TEST_BROWSER_VERSION || 'ANY'
  },

  onPrepare: function() {
    // The require statement must be down here, since jasmine-reporters
    // needs jasmine to be in the global and protractor does not guarantee
    // this until inside the onPrepare function.
    require('jasmine-reporters');
    var reporter = new jasmine.JUnitXmlReporter('test-results', true, true);
    jasmine.getEnv().addReporter(reporter);
  },
};
