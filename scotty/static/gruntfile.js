// jshint node:true, camelcase:false

module.exports = function(grunt) {
  'use strict';
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    files: grunt.file.readJSON('config/grunt-files.json'),

    jshint: grunt.file.readJSON('config/grunt-jshint.json'),
    less: grunt.file.readJSON('config/grunt-less.json'),
    clean: grunt.file.readJSON('config/grunt-clean.json'),
    githooks: grunt.file.readJSON('config/grunt-githooks.json'),

    // build
    requirejs: grunt.file.readJSON('config/grunt-requirejs.json'),
    uglify: grunt.file.readJSON('config/grunt-uglify.json'),
    ngAnnotate: grunt.file.readJSON('config/grunt-ngannotate.json'),
    copy: grunt.file.readJSON('config/grunt-copy.json'),
    usemin: grunt.file.readJSON('config/grunt-usemin.json'),

    // tests
    watch: grunt.file.readJSON('config/grunt-watch.json'),
    karma: grunt.file.readJSON('config/grunt-karma.json'),
    protractor: grunt.file.readJSON('config/grunt-protractor.json'),
    protractor_webdriver: grunt.file.readJSON('config/grunt-protractor_webdriver.json'),
  });

  grunt.config.set('jshint.options.reporter', require('jshint-stylish'));

  var configFile = grunt.option('config-file');
  if (configFile)
    grunt.config.set('requirejs.options.paths.conf', configFile.replace(/\.js$/, ''));


  var apps = [
    'admin',
    'candidate',
    'employer',
    'index',
  ];

  var timestamp = Date.now();
  apps.forEach(function(app) {
    var js = 'files.' + app + '.out.js';
    var css = 'files.' + app + '.out.css';
    grunt.config.set(js, grunt.config.get(js).replace(/TIMESTAMP/, timestamp));
    grunt.config.set(css, grunt.config.get(css).replace(/TIMESTAMP/, timestamp));
  });

  // generate specific tasks for each app
  apps.forEach(function(app) {
    grunt.registerTask('build-' + app + '-css', [ 'less:' + app ]);
    grunt.registerTask('build-' + app + '-js', [
      'requirejs:' + app,
      'ngAnnotate:amd',
      'uglify:' + app,
      'clean:tmp',
    ]);
    grunt.registerTask('build-' + app, [
      'build-' + app + '-js',
      'build-' + app + '-css',
      'copy:' + app,
      'usemin:' + app,
    ]);
  });

  // generate specific task for tool

  grunt.registerTask('build-css', apps.map(function(app) {
    return 'build-' + app + '-css';
  }));
  grunt.registerTask('build-js', [ 'jshint:apps' ].concat(apps.map(function(app) {
    return 'build-' + app + '-js';
  })));
  grunt.registerTask('build', [ 'jshint:apps', 'clean:build' ].concat(apps.map(function(app) {
    return 'build-' + app;
  })));

  grunt.registerTask('test:unit', [ 'karma:apps' ]);
  grunt.registerTask('test:e2e', [
    'protractor_webdriver',
    'protractor',
  ]);
  grunt.registerTask('test', [
    'jshint:apps',
    'test:unit',
    'test:e2e',
  ]);

  grunt.registerTask('default', [ 'build' ]);
};
