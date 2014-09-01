//jshint maxlen:120, camelcase:false

module.exports = function(grunt) {
  'use strict';
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-angular-templates');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    files: {

      tools: {
        js: 'components/**/*.js',
        test: 'components/**/*.unit.js',
      },

      components: {
        js: 'components/**/*.js',
        test: [
          'components/**/*.e2e.js',
          'components/**/*.unit.js',
        ]
      },

      admin: {
        html: 'public/admin.html',
        less: 'apps/admin/styles.less',
        test: [
          '<%= files.tools.test %>',
          '<%= files.components.test %>',
        ],
        js: [
          'apps/admin/**/*.js',
          '<%= files.tools.js %>',
          '<%= files.components.js %>',
        ],
        out: {
          js: 'public/admin.js',
          css: 'public/admin.css',
        }
      },

      candidate: {
        html: 'public/candidate.html',
        less: 'apps/candidate/styles.less',
        test: [
          '<%= files.tools.test %>',
          '<%= files.components.test %>',
        ],
        js: [
          'apps/candidate/**/*.js',
          '<%= files.tools.js %>',
          '<%= files.components.js %>',
        ],
        out: {
          js: 'public/candidate.js',
          css: 'public/candidate.css',
        }
      },

      employer: {
        html: 'public/employer.html',
        less: 'apps/employer/styles.less',
        test: [
          '<%= files.tools.test %>',
          '<%= files.components.test %>',
        ],
        js: [
          'apps/employer/**/*.js',
          '<%= files.tools.js %>',
          '<%= files.components.js %>',
        ],
        out: {
          js: 'public/employer.js',
          css: 'public/employer.css',
        }
      },

      index: {
        html: 'public/index.html',
        less: 'apps/index/styles.less',
        test: [
          '<%= files.tools.test %>',
          '<%= files.components.test %>',
        ],
        js: [
          'apps/index/**/*.js',
          '<%= files.tools.js %>',
          '<%= files.components.js %>',
        ],
        out: {
          js: 'public/index.js',
          css: 'public/index.css',
        }
      },

      build: {
        amd: 'tmp/amd-build.js',
        ngannotate: 'tmp/ngannotate-build.js',
      },

      all: {
        js: [
          '<%= files.admin.js %>',
          '<%= files.candidate.js %>',
          '<%= files.employer.js %>',
          '<%= files.index.js %>',
        ],
        test: [
          '<%= files.admin.test %>',
          '<%= files.candidate.test %>',
          '<%= files.employer.test %>',
          '<%= files.index.test %>',
        ],
      }
    },

    jshint: {
      options:{
        jshintignore: '.jshintignore',
        jshintrc: '.jshintrc'
      },
      config: [
        '*.json',
        '.jshintrc',
        'gruntfile.js',
      ],

      apps: [ '<%= files.apps.js %>' ],
      admin: [ '<%= files.admin.js %>' ],
      candidate: [ '<%= files.candidate.js %>' ],
      employer: [ '<%= files.employer.js %>' ],
      index: [ '<%= files.index.js %>' ],

      apps_test: [ '<%= files.apps.test' ],
      admin_test: [ '<%= files.admin.test %>' ],
      candidate_test: [ '<%= files.candidate.test %>' ],
      employer_test: [ '<%= files.employer.test %>' ],
      index_test: [ '<%= files.index.test %>' ],
    },

    requirejs: {
      options: {
        baseUrl: '',
        optimize: 'none',
        name: 'bower_components/almond/almond',
        out: '<%= files.build.amd %>',
        paths: {
          'angular-core': 'bower_components/angular/angular.min',
          'angular': 'bower_components/angular-ui-router/release/angular-ui-router.min',
        },
      },

      admin: {
        options: {
          mainConfigFile: 'apps/admin/requirejs-config.js',
          include: 'apps/admin/app',
          insertRequire: [ 'apps/admin/app' ],
        }
      },
      candidate: {
        options: {
          mainConfigFile: 'apps/candidate/requirejs-config.js',
          include: 'apps/candidate/app',
          insertRequire: [ 'apps/candidate/app' ],
        }
      },
      employer: {
        options: {
          mainConfigFile: 'apps/employer/requirejs-config.js',
          include: 'apps/employer/app',
          insertRequire: [ 'apps/employer/app' ],
        }
      },
      index: {
        options: {
          mainConfigFile: 'apps/index/requirejs-config.js',
          include: 'apps/index/app',
          insertRequire: [ 'apps/index/app' ],
        }
      }
    },

    ngAnnotate: {
      // Will be supported soon
      //options: { regexp: 'require(\'app-module\')', },
      amd: {
        src: '<%= files.build.amd %>',
        dest: '<%= files.build.ngannotate %>'
      },
    },

    uglify: {
      options: {
        compress: {
          global_defs: { DEBUG: false },
          pure_getters: true,
          drop_console: true,
          //pure_funcs: [ 'require' ],
        },
      },

      admin: {
        src: '<%= files.build.ngannotate %>',
        dest: '<%= files.admin.out.js %>',
      },
      candidate: {
        src: '<%= files.build.ngannotate %>',
        dest: '<%= files.candidate.out.js %>',
      },
      employer: {
        src: '<%= files.build.ngannotate %>',
        dest: '<%= files.employer.out.js %>',
      },
      index: {
        src: '<%= files.build.ngannotate %>',
        dest: '<%= files.index.out.js %>',
      },
    },

    less: {
      options: {
        cleancss: true,
        relativeUrls: true,
      },

      admin: {
        src: '<%= files.admin.less %>',
        dest: '<%= files.admin.out.css %>',
      },
      candidate: {
        src: '<%= files.candidate.less %>',
        dest: '<%= files.candidate.out.css %>',
      },
      employer: {
        src: '<%= files.employer.less %>',
        dest: '<%= files.employer.out.css %>',
      },
      index: {
        src: '<%= files.index.less %>',
        dest: '<%= files.index.out.css %>',
      },
    },

    usemin: {
      options: { type: 'html' },
      admin: { src: '<%= files.admin.html %>' },
      candidate: { src: '<%= files.candidate.html %>' },
      employer: { src: '<%= files.employer.html %>' },
      index: { src: '<%= files.index.html %>' },
    },

    clean: {
      tmp: [ 'tmp/' ],
      buildjs: [
        '<%= files.admin.out.js %>',
        '<%= files.candidate.out.js %>',
        '<%= files.employer.out.js %>',
        '<%= files.index.out.js %>',
      ],
      buildcss: [
        '<%= files.admin.out.css %>',
        '<%= files.candidate.out.css %>',
        '<%= files.employer.out.css %>',
        '<%= files.index.out.css %>',
      ],
    },
  });



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
  grunt.registerTask('build', apps.map(function(app) {
    return 'build-' + app;
  }));

  grunt.registerTask('default', [ 'build' ]);
};
