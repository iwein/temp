// jshint node:true, camelcase:false

module.exports = function(grunt) {
  'use strict';
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    karma: {
      ci: {
        options: {
          configFile: 'karma.conf.js',
          autoWatch: false,
          singleRun: true,
          reporters: [ 'dots', 'junit' ],
          client: { captureConsole: false },
          junitReporter: { outputFile: 'test-results.xml' },
          browsers: [
            'PhantomJS',
            //'Chrome',
            //'Firefox' - requires `npm install --save karma-firefox-launcher`
          ],
        }
      },
      watch: {
        options: {
          configFile: 'karma.conf.js',
          autoWatch: true,
          singleRun: false,
          reporters: [ 'progress' ],
          browsers: [
            //'PhantomJS',
            'Chrome',
            //'Firefox' - requires `npm install --save karma-firefox-launcher`
          ],
        }
      }
    },

    jshint: {
      options: {
        jshintignore: '.jshintignore',
        jshintrc: '.jshintrc'
      },
      all: [ 'features/**/*.js' ],
    },

    copy: {
      config: {
        src: grunt.option('config-file') || 'config-ci.js',
        dest: '__config__.js',
      },
    },

    clean: {
      all: [ '__config__.js' ],
    }
  });

  grunt.config.set('jshint.options.reporter', require('jshint-stylish'));
  grunt.registerTask('lint', [ 'jshint:all' ]);
  grunt.registerTask('watch', [
    'copy:config',
    'karma:watch',
    'clean:all',
  ]);

  grunt.registerTask('ci', [
    'lint',
    'copy:config',
    'karma:ci',
    'clean:all',
  ]);

  grunt.registerTask('default', [ 'ci' ]);
};
