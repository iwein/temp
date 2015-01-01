define(function(require) {
  'use strict';
  var module = require('app-module');
  module.directive('hcTypeaheadLoader', function() {
    return {
      priority: 1,
      restrict: 'A',
      compile: function(elem, attr) {
        var ul = document.createElement('ul');
        var li = document.createElement('li');
        var spinner = document.createElement('div');
        spinner.className = 'spinner';
        ul.className = 'dropdown-menu typeahead-loader-container';
        li.appendChild(spinner);
        ul.appendChild(li);

        var element = elem[0];
        var parent = element.parentNode;
        var sibling = element.nextElementSibling;
        parent.insertBefore(ul, sibling);

        var id = '_autoloader' + Math.round(Math.random() * 10000);
        attr.typeaheadLoading = id;

        return function(scope, elem) {
          scope.$watch(id, function(value) {
            elem.parent()[value ? 'addClass' : 'removeClass']('typeahead-loading');
          });
        };
      },
    };
  });
});
