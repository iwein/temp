define(function(require) {
  'use strict';

  function Notifier(timeout, sce) {
    this.ids = 0;
    this.sce = sce;
    this.timeout = timeout;
    this.notifications = [];
    this.error = this.show.bind(this, 'error');
    this.warning = this.show.bind(this, 'warning');
    this.info = this.show.bind(this, 'info');
    this.success = this.show.bind(this, 'success');
  }

  Notifier.prototype = {
    colors: {
      'error': 'alert alert-danger',
      'info': 'alert alert-info',
      'warning': 'alert alert-warning',
      'success': 'alert alert-success',
    },

    show: function(type, message, opts) {
      opts = opts||{};

      var item = {
        id: this.ids++,
        type: type,
        classes: this.colors[type] || type,
        message: opts.html ? this.sce.trustAsHtml(message) : message,
        html: opts.html,
        untilStateChange: opts.untilStateChange,
      };

      var display = function() {
        var index = this.notifications.indexOf(item);
        if (index !== -1)
          this.notifications.splice(index, 1);
      }.bind(this);

      this.notifications.push(item);
      if(!opts.untilStateChange)
        this.timeout(display, 8000);
    },

    clean: function() {
      this.notifications = this.notifications.filter(function(entry) {
        return !entry.untilStateChange;
      });
    }
  };

  var module = require('app-module');
  module.factory('Notifier', function($timeout, $rootScope, $sce) {
    var notifierService = new Notifier($timeout, $sce);
    $rootScope.$on('$stateChangeSuccess', function(){
      notifierService.clean();
    });
    return notifierService;
  });

  module.directive('hcNotifications', function() {
    return {
      template: require('text!./notifier-template.html'),
      controller: function($scope, Notifier) {
        $scope.notifier = Notifier;
      },
    };
  });


  return Notifier;
});
