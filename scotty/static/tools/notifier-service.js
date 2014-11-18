define(function(require) {
  'use strict';

  function Notifier(timeout, list) {
    this.ids = 0;
    this.list = list;
    this.timeout = timeout;
    this.error = this.show.bind(this, 'error');
  }

  Notifier.prototype = {
    colors: {
      'error': 'danger',
    },

    show: function(type, message) {
      var item = {
        id: this.ids++,
        type: type,
        color: this.colors[type] || type,
        message: message,
      };

      this.list.push(item);
      this.timeout(function() {
        var index = this.list.indexOf(item);
        if (index !== -1)
          this.list.splice(index, 1);
      }.bind(this), 5000);
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
      template: [
        '<div ng-repeat="notification in notifications" class="alert alert-{{ notification.color }}">',
          '{{ notification.message }}',
        '</div>',
      ].join('')
    };
  });


  return Notifier;
});
