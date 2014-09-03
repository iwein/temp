// jshint node:true, camelcase:false

module.exports = function(grunt) {
  'use strict';
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-githooks');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-protractor-runner');
  grunt.loadNpmTasks('grunt-protractor-webdriver');

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
    usemin: grunt.file.readJSON('config/grunt-usemin.json'),

    // tests
    karma: grunt.file.readJSON('config/grunt-karma.json'),
    protractor: grunt.file.readJSON('config/grunt-protractor.json'),
    protractor_webdriver: grunt.file.readJSON('config/grunt-protractor_webdriver.json'),
  });

  grunt.config.set('jshint.options.reporter', require('jshint-stylish'));



  var apps = [
    'admin',
    'candidate',
    'employer',
    'index',
  ];

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
  grunt.registerTask('build', [ 'jshint:apps' ].concat(apps.map(function(app) {
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
