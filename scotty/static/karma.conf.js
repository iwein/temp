/*globals module*/
// Karma configuration
// Generated on Wed Oct 02 2013 11:59:43 GMT+0200 (CEST)

module.exports = function(config) {
	'use strict';

	config.set({

		// base path, that will be used to resolve files and exclude
		basePath: '',


		// frameworks to use
		frameworks: [ 'jasmine', 'requirejs' ],


		files: [
			{ pattern: 'bower_components/angular/angular.js', included: false },
			{ pattern: 'bower_components/angular-mocks/angular-mocks.js', included: false },
			{ pattern: 'bower_components/angular-ui-router/release/angular-ui-router.js', included: false },
			{ pattern: 'apps/**/*.js', included: false },
			{ pattern: 'tools/**/*.js', included: false },
			{ pattern: 'components/**/*.js', included: false },
			'test_runner.js',
		],

		// list of files to exclude
		exclude: [

		],


		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: [ 'progress', 'junit' ],

		junitReporter: {
      outputFile: 'test-results/unit-tests.xml',
      suite: ''
    },


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers: [
			'PhantomJS',
			'Chrome',
			'Firefox'
		],


		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,


		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: false
	});
};
