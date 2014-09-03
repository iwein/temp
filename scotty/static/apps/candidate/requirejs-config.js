window.DEBUG = true;

requirejs.config({

  baseUrl: '../',

  paths: {
    // vendors
    'text': 'bower_components/text/text',
    'angular-core': 'bower_components/angular/angular',
    'angular': 'bower_components/angular-ui-router/release/angular-ui-router',
    'ui.bootstrap': 'vendor/bootstrap-custom/ui-bootstrap-custom-tpls-0.10.0',

    // aliases
    'app-module': 'apps/candidate/candidate-module',
  },

  shim: {
    'angular': {
      deps: [ 'angular-core' ],
      exports: 'angular',
    },
    'ui.bootstrap': [ 'angular' ],
  }

})([ 'apps/candidate/app' ]);
