define(function() {
  'use strict';

  return function booleanAttrs(scope, attrs, values) {
    values.forEach(function(value) {
      if (value in attrs) scope[value] = true;
    });
  };
});
