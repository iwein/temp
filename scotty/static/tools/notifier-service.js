define(function(require) {
  'use strict';

  function Notifier(timeout, list) {
    this.ids = 0;
    this.list = list;
    this.timeout = timeout;
    this.error = this.show.bind(this, 'error');
    this.warning = this.show.bind(this, 'warning');
    this.info = this.show.bind(this, 'info');
    this.success = this.show.bind(this, 'success');
  }

  Notifier.prototype = {
    colors: {
      'error': 'danger'
    },

    show: function(type, message, permanent) {
      var item = {
        id: this.ids++,
        type: type,
        color: this.colors[type] || type,
        message: message,
      };

      var display = function() {
        var index = this.list.indexOf(item);
        if (index !== -1)
          this.list.splice(index, 1);
      }.bind(this);

      this.list.push(item);
      if(permanent)
        display();
      else
        this.timeout(display, 5000);
    }
  };

  var module = require('app-module');
  module.factory('Notifier', function($timeout, $rootScope) {
    var notifications = [];
    $rootScope.notifications = notifications;
    return new Notifier($timeout, notifications);
  });
  module.directive('hcNotifications', function() {
    return {
      template: require('text!/tools/notifier-template.html')
    };
  });


  return Notifier;
});
