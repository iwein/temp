// jshint node:true, camelcase:false

module.exports = function(grunt) {
  'use strict';
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    files: {
    },

    karma: {
      ci: {
        options: {
          configFile: 'karma.conf.js',
          autoWatch: false,
          singleRun: true,
          reporters: [ 'progress' ],
          browsers: [
            'PhantomJS',
            //'Chrome',
            //'Firefox'
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
            //'Firefox'
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

  });

  grunt.config.set('jshint.options.reporter', require('jshint-stylish'));
  grunt.registerTask('lint', [ 'jshint:all' ]);
  grunt.registerTask('watch', [ 'karma:watch' ]);

  grunt.registerTask('ci', [
    'lint',
    'karma:ci',
  ]);

  grunt.registerTask('default', [ 'ci' ]);
};
