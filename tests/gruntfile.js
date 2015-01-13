// jshint node:true, camelcase:false

module.exports = function(grunt) {
  'use strict';
  if (!process.env.APIKEY)
    throw new Error('APIKEY env variable not provided');

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

    'file-creator': {
      vars: {
        'test-vars.js': function(fs, fd, done) {
          fs.writeSync(fd, 'var test_vars = { apikey: "' + process.env.APIKEY + '" };');
          done();
        }
      }
    },

    clean: {
      all: [ 'test-vars.js' ],
    }
  });

  grunt.config.set('jshint.options.reporter', require('jshint-stylish'));
  grunt.registerTask('lint', [ 'jshint:all' ]);
  grunt.registerTask('watch', [
    'file-creator:vars',
    'karma:watch',
    'clean:all',
  ]);

  grunt.registerTask('ci', [
    'lint',
    'file-creator:vars',
    'karma:ci',
    'clean:all',
  ]);

  grunt.registerTask('default', [ 'ci' ]);
};
