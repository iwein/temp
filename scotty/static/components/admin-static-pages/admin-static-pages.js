define(function(require) {
  'use strict';
  var module = require('app-module');


  module.controller('StaticPagesCtrl', function($scope, API) {
    $scope.edit = edit;
    $scope.submit = submit;


    function edit(page) {
      var parts = [ 'TOP', 'LEFT', 'RIGHT', 'BOTTOM' ].map(function(part) {
        return page + '_' + part;
      });

      return API.get('/cms/get?keys=' + parts.join(',')).then(function(data) {
        var parts = { id: page };
        data.forEach(function(part) {
          parts[part.key.split('_')[1]] = part.value;
        });
        $scope.model = parts;
      });
    }

    function submit(model) {
      return API.put('/cms/set', [{
        key: model.id + '_TOP',
        value: model.TOP,
      }, {
        key: model.id + '_LEFT',
        value: model.LEFT,
      }, {
        key: model.id + '_RIGHT',
        value: model.RIGHT,
      }, {
        key: model.id + '_BOTTOM',
        value: model.BOTTOM,
      }]).then(function() {
        $scope.model = {};
      });
    }
  });


  return {
    url: '/static-pages/',
    template: require('text!./admin-static-pages.html'),
    controller: 'StaticPagesCtrl',
    controllerAs: 'staticPages',
  };
});
