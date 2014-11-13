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

        ConfigAPI.countries({ limit: 500 }).then(fn.setTo('countries', $scope));
        ConfigAPI.salutations().then(fn.setTo('salutations', $scope));

        nameAttr(this, 'hcOfficeForm', $scope, $attrs);
        setModel($attrs.ngModel ? getModel($attrs.ngModel, $scope) : {});


        function reset() {
          $scope.editing = false;
          if ($scope.formOffice)
            $scope.formOffice.$setPristine();
          $scope.model = {};
        }

        function isPristine() {
          return $scope.formOffice.$pristine;
        }

        function setModel(model) {
          model = JSON.parse(JSON.stringify(model));
          $scope.editing = !!model.id;
          $scope.model = model;
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
            return $q.when($scope.editing ? user.deleteOffice($scope.model) : null).then(function() {
              return user.addOffice($scope.model);
            });
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