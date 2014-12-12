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

    show: function(type, message, opts) {
      opts = opts||{};

      var item = {
        id: this.ids++,
        type: type,
        color: this.colors[type] || type,
        message: message,
        untilStateChange: opts.untilStateChange
      };

      var display = function() {
        var index = this.list.indexOf(item);
        if (index !== -1)
          this.list.splice(index, 1);
      }.bind(this);

      this.list.push(item);
      if(!opts.untilStateChange)
        this.timeout(display, 10000);
    },

    clean: function(){
      for(var i = this.list.length -1; i >= 0 ; i--){
        if(!this.list[i].untilStateChange){
          this.list.splice(i, 1);
        }
      }
    }
  };

  var module = require('app-module');
  module.factory('Notifier', function($timeout, $rootScope) {
    var notifications = [];
    var notifierService = new Notifier($timeout, notifications);
    $rootScope.notifications = notifications;

    $rootScope.$on('$stateChangeSuccess', function(){
      notifierService.clean();
    });
    return notifierService;
  });

  module.directive('hcNotifications', function() {
    return {
      template: require('text!/tools/notifier-template.html')
    };
  });


  return Notifier;
});
