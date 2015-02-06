// jshint node:true, camelcase:false

module.exports = function(grunt) {
  'use strict';
  var configFile = grunt.option('config-file');
  //var configContents = require(configFile);
  var configModule = configFile && configFile.replace(/\.js$/, '');
  /*
  var metalsmith = grunt.file.readJSON('config/grunt-metalsmith.json');
  metalsmith["static-pages"].options.plugins["metalsmith-templates"].helpers = {
    tr: function() {
      return 'FOOBAR';
    }
  };
  */

  grunt.initConfig({
    env: require(configModule || './config/config'),
    pkg: grunt.file.readJSON('package.json'),
    files: grunt.file.readJSON('config/grunt-files.json'),

    jshint: grunt.file.readJSON('config/grunt-jshint.json'),
    less: grunt.file.readJSON('config/grunt-less.json'),
    clean: grunt.file.readJSON('config/grunt-clean.json'),
    githooks: grunt.file.readJSON('config/grunt-githooks.json'),

    // i18n
    execute: grunt.file.readJSON('config/grunt-execute.json'),
    nggettext_extract: grunt.file.readJSON('config/grunt-nggettext_extract.json'),
    nggettext_compile: grunt.file.readJSON('config/grunt-nggettext_compile.json'),
    msgmerge: grunt.file.readJSON('config/grunt-msgmerge.json'),

    // build
    metalsmith: grunt.file.readJSON('config/grunt-metalsmith.json'),
    requirejs: grunt.file.readJSON('config/grunt-requirejs.json'),
    uglify: grunt.file.readJSON('config/grunt-uglify.json'),
    ngAnnotate: grunt.file.readJSON('config/grunt-ngannotate.json'),
    copy: grunt.file.readJSON('config/grunt-copy.json'),
    replace: grunt.file.readJSON('config/grunt-replace.json'),
    usemin: grunt.file.readJSON('config/grunt-usemin.json'),

    // tests
    watch: grunt.file.readJSON('config/grunt-watch.json'),
    karma: grunt.file.readJSON('config/grunt-karma.json'),
    protractor: grunt.file.readJSON('config/grunt-protractor.json'),
    protractor_webdriver: grunt.file.readJSON('config/grunt-protractor_webdriver.json'),
  });

  grunt.task.loadTasks('./tasks');
  require('load-grunt-tasks')(grunt);
  grunt.config.set('jshint.options.reporter', require('jshint-stylish'));
  if (configModule)
    grunt.config.set('requirejs.options.paths.conf', configModule);

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
    ]);
    grunt.registerTask('build-' + app, [
      'build-' + app + '-js',
      'build-' + app + '-css',
      'copy:' + app + '-resources',
      'copy:' + app,
      'replace:' + app,
      'usemin:' + app,
      'clean:tmp',
    ]);
  });

  grunt.renameTask('build-index', 'build-index-internal');
  grunt.registerTask('build-index', [
    'metalsmith:static-pages',
    'build-index-internal',
    'clean:pages-folder'
  ]);

  // generate specific task for tool

  grunt.registerTask('build-css', apps.map(function(app) {
    return 'build-' + app + '-css';
  }));
  grunt.registerTask('build-js', [ 'jshint:apps' ].concat(apps.map(function(app) {
    return 'build-' + app + '-js';
  })));
  grunt.registerTask('build', [
    'jshint:apps',
    'clean:build',
    'i18n:compile',
  ].concat(apps.map(function(app) {
    return 'build-' + app;
  })));

  grunt.registerTask('test:unit', [ 'karma:apps' ]);
  grunt.registerTask('test:e2e', [
    'protractor_webdriver',
    'protractor',
  ]);
  grunt.registerTask('dev:static-pages', [
    'metalsmith:static-pages',
    'copy:static-pages',
    'clean:pages-folder',
  ]);

  grunt.registerTask('dev', [ 'dev:static-pages' ]);
  grunt.registerTask('test', [
    'jshint:apps',
    'test:unit',
    'test:e2e',
  ]);

  grunt.registerTask('i18n:extract', [
    'execute:db-tokens',
    'nggettext_extract:pot',
    'msgmerge:all',
    'clean:tmp',
  ]);
  grunt.registerTask('i18n:compile', [ 'nggettext_compile:all' ]);

  grunt.registerTask('lint', [ 'jshint:pre-commit' ]);
  grunt.registerTask('listen', [ 'watch:static' ]);
  grunt.registerTask('default', [ 'build' ]);
};
