/*globals module*/
var params = require('./karma.config.js');

module.exports = function(config) {
  'use strict';
  // level of logging
  // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  params.logLevel = config.LOG_INFO,


  // enable / disable watching file and executing tests whenever any file changes
  params.autoWatch = false,


  // Start these browsers, currently available:
  // - Chrome
  // - ChromeCanary
  // - Firefox
  // - w
  // - Safari (only Mac)
  // - PhantomJS
  // - IE (only Windows)
  params.browsers = [
    'PhantomJS',
    //'Chrome',
    //'Firefox'
  ],


  // Continuous Integration mode
  // if true, it capture browsers, run tests and exit
  params.singleRun = true


  config.set(params);
};
