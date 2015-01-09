define(function(require) {
  'use strict';
  var fn = require('tools/fn');
  var nameAttr = require('tools/name-attr');
  var module = require('app-module');

  module.directive('hcOfficeForm', function($parse) {
    function getModel(ngModel, scope) {
      var model = $parse(ngModel);
      var value = model(scope) || model(scope.$parent) || model(scope.$parent.$parent);
      return JSON.parse(JSON.stringify(value));
    }

    return {
      restrict: 'EA',
      scope: {
        onSubmit: '&',
        hcShowEmpty: '=',
        hcRequired: '=',
        hcDisabled: '=',
      },
      transclude: true,
      template: require('text!./directive-office-form.html'),
      controller: function($scope, $attrs, $q, ConfigAPI, Session) {
        $scope.searchLocations = searchLocations;
        $scope.setLocation = setLocation;
        $scope.submit = submit;
        this.isPristine = isPristine;
        this.setModel = setModel;
        this.reset = reset;
        this.save = save;
        var citiesCache = [];
        var ctrl = this;
        var modelWaiting;

        $q.all([
          ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope)),
          ConfigAPI.salutations().then(fn.setTo('salutations', $scope)),
        ]).then(function() {
          $scope.ready = true;

          if ($attrs.ngModel)
            setModel(getModel($attrs.ngModel, $scope));
          else
            setModel(modelWaiting || {});
        });

        nameAttr(this, 'hcOfficeForm', $scope, $attrs);

        function afterModelChange() {
          var model = $scope.model || {};
          var location = model.address_city = model.address_city || {};
          location.country_iso = location.country_iso || 'DE';
        }

        function reset() {
          $scope.editing = false;
          if ($scope.formOffice)
            $scope.formOffice.$setPristine();
          $scope.model = {};
          afterModelChange();
        }

        function isPristine() {
          return $scope.formOffice.$pristine;
        }

        function setModel(model) {
          model = JSON.parse(JSON.stringify(model));
          $scope.editing = !!model.id;

          if ($scope.ready)
            $scope.model = model;
          else
            modelWaiting = model;

          afterModelChange();
        }

        function submit() {
          Object.keys($scope.model).forEach(function(key) {
            if (!$scope.model[key])
              delete $scope.model[key];
          });

          $scope.onSubmit({ $model: $scope.model, $form: ctrl });
        }

        function save() {
          return Session.getUser().then(function(user) {
            return $scope.editing ?
              user.editOffice($scope.model) :
              user.addOffice($scope.model);
          });
        }

        function searchLocations(term, country) {
          return ConfigAPI.locations({
            country_iso: country,
            q: term,
          }).then(function(locations) {
            citiesCache = locations.map(fn.get('city'));
            return citiesCache;
          });
        }

        function setLocation(city) {
          $scope.errorInvalidCity = citiesCache.indexOf(city) === -1;
          if ($scope.errorInvalidCity)
            $scope.model.address_city.city = '';
        }
      },
    };
  });
});
