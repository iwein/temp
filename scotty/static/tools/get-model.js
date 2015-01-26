define(function() {
  'use strict';

  return function getModel(getter, scope) {
    var value;

    while (scope && !value) {
      value = getter(scope);
      scope = scope.$parent;
    }

    return JSON.parse(JSON.stringify(value));
  };
});
