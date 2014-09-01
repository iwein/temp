window.DEBUG = true;

requirejs.config({

  baseUrl: '../',

  paths: {
    // vendors
    'angular-core': 'bower_components/angular/angular',
    'angular': 'bower_components/angular-route/angular-route',

    // aliases
    //'tools': '../../tools',
    //'components': '../../components',
    'app-module': 'apps/admin/admin-module',
  },

  shim: {
    'angular': {
      deps: [ 'angular-core' ],
      exports: 'angular',
    }
  }

})([ 'apps/admin/app' ]);
