window.DEBUG = true;

requirejs.config({

  baseUrl: '../../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'underscore': 'bower_components/underscore/underscore',
    'moment': 'bower_components/moment/moment',
    'moment-de': 'bower_components/moment/locale/de',
    'ZeroClipboard': 'bower_components/zeroclipboard/dist/ZeroClipboard',
    'ZeroClipboard-wrapper': 'apps/common/zeroclipboard-wrapper',
    'angular': 'bower_components/angular/angular',
    'angular-router': 'bower_components/angular-ui-router/release/angular-ui-router',
    'angular-animate': 'bower_components/angular-animate/angular-animate',
    'angular-sanitize': 'bower_components/textAngular/dist/textAngular-sanitize.min',
    'angular-gettext': 'bower_components/angular-gettext/dist/angular-gettext',
    'angular-touch': 'bower_components/angular-touch/angular-touch',
    'angular-loading-bar': 'bower_components/angular-loading-bar/build/loading-bar',
    'angular-bootstrap-lightbox': 'bower_components/angular-bootstrap-lightbox/dist/angular-bootstrap-lightbox',
    'ui.bootstrap': 'bower_components/angular-bootstrap/ui-bootstrap-tpls',
    'ng-clip': 'bower_components/ng-clip/src/ngClip',
    'textangular': 'bower_components/textAngular/dist/textAngular.min',
    'angulartics': 'bower_components/angulartics/src/angulartics',
    'angulartics-ga': 'bower_components/angulartics/src/angulartics-ga',

    // aliases
    'conf': 'config/config',
    'app-module': 'apps/candidate/candidate-module',
    'session': 'apps/candidate/session',
  },

  shim: {
    'angular': { exports: 'angular' },
    'angulartics': [ 'angular' ],
    'angulartics-ga': [ 'angulartics' ],
    'ui.bootstrap': [ 'angular' ],
    'angular-router': [ 'angular' ],
    'angular-animate': [ 'angular' ],
    'angular-sanitize': [ 'angular' ],
    'angular-gettext': [ 'angular' ],
    'angular-touch': [ 'angular' ],
    'angular-loading-bar': [ 'ui.bootstrap' ],
    'angular-bootstrap-lightbox': [
      'angular-loading-bar',
      'angular-touch',
    ],
    'ng-clip': [
      'ZeroClipboard-wrapper',
      'angular',
    ],
    'textangular': [ 'angular-sanitize' ],
    'apps/common/translations': [ 'angular-gettext' ],
  }

})([ 'apps/common/mock-data', 'apps/candidate/app' ]);
