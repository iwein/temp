// Disable warning about creating functions inside a conditional
// jshint -W082
// jshint strict:false

define(function(require) {
  if (DEBUG) {
    var angular = require('angular');
    var module = require('app-module');
    var moment = require('moment');

    function $(selector) {
      var elements = document.querySelectorAll(selector);
      return Array.prototype.slice.call(elements);
    }

    function random(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    }

    function randomElement(array, skip) {
      skip = skip || 0;
      return array[random(skip, array.length)];
    }

    var guid = (function() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
      }
      return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
      };
    })();



    module.run(function($parse) {
      function getScope(element) {
        return angular.element(element).scope();
      }
      function set(element, attribute, value) {
        var arg = element.getAttribute(attribute);
        if (!arg)
          return;

        var model = $parse(arg);
        var scope = getScope(element);
        var val = typeof value === 'function' ? value(element) : value;
        model.assign(scope, val);
      }
      function get(element, attribute) {
        var arg = element.getAttribute(attribute);
        if (arg)
          $parse(arg)(getScope(element));
      }


      function setValue(selector, value) {
        $(selector).map(function(element) {
          set(element, 'ng-model', value);
          get(element, 'ng-change');
          return element;
        });
      }

      var fillForm = window.f = function() {
        setValue('textarea', guid);
        setValue('input[type=text]', guid);
        setValue('input[type=email]', function() {
          if (!localStorage.mockEmail) return;
          if (!localStorage.mockEmailCounter) localStorage.mockEmailCounter = 0;
          return localStorage.mockEmail.replace('%D%', localStorage.mockEmailCounter++);
        });
        setValue('input[type=password]', '123123123');
        setValue('input[type=number]', random.bind(null, 1900, 2100));
        setValue('input[type=url]', document.location.toString());
        setValue('select', function(element) {
          return randomElement(element.children, 1).innerHTML;
        });
        setValue('input[type=date]', function() {
          return moment().format('YYYY-MM-DD');
        });
        setValue('input[name=zipcode]', random.bind(null, 10000, 99999));

        // special fields
        $('form[name=formTarget] input[name=availability]').forEach(function(element) {
          var valid = [ '2015-01-01', '2000-12-31', '3d', '2w 1m', '3m' ];
          set(element, 'ng-model', randomElement(valid));
        });
        $('form[name=formTarget] input[name=cities]').forEach(function(element) {
          set(element, 'ng-model', '');
          getScope(element).signup.cities = [{
            city: 'Barcelona',
            country_iso: 'ES',
          }];
        });
        $('form[name=formExperience] input[name=location]').forEach(function(element) {
          set(element, 'ng-model', 'Barcelona, ES');
          getScope(element).model.location = {
            city: 'Barcelona',
            country_iso: 'ES',
          };
        });
        $('form[name=formProfile] input[name=location]').forEach(function(element) {
          set(element, 'ng-model', 'Barcelona, ES');
          getScope(element).model.contact_city = {
            city: 'Barcelona',
            country_iso: 'ES',
          };
        });



        angular.element($('form')[0]).scope().$apply();
      };

      var btn = document.createElement('button');
      btn.innerHTML = 'mock_data';
      btn.onclick = fillForm;
      angular.extend(btn.style, {
        position: 'fixed',
        bottom: 0,
        right: 0,
      });
      document.body.appendChild(btn);
    });
  }
});
