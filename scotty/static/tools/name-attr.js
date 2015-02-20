define(function() {
  'use strict';

  return function nameAttr(ctrl, directive, scope, attr) {
    var name = attr.name || attr[directive];
    if (!name) return;

    if (attr.hcContainer) {
      scope.$parent.$watch(attr.hcContainer, function(value) {
        if (value)
          value[name] = ctrl;
      });
    } else {
      if ('ngIf' in attr)
        scope.$parent.$parent[name] = ctrl;
      else
        scope.$parent[name] = ctrl;
    }
  };
});
