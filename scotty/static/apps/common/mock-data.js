// Disable warning about creating functions inside a conditional
// jshint -W082
// jshint strict:false

define(function(require) {
  if (DEBUG) {
    var angular = require('angular');
    var module = require('app-module');

    function $(selector) {
      var elements = document.querySelectorAll(selector);
      return Array.prototype.slice.call(elements);
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
          return 'amatiasq+test' + (localStorage.foobar++) + '@gmail.com';
        });
        setValue('input[type=password]', '123123123');
        setValue('input[type=number]', function() {
          return Math.round(Math.random() * 200) + 1900;
        });
        setValue('select', function(element) {
          var options = Array.prototype.slice.call(element.children);
          var rand = Math.floor(Math.random() * (options.length - 1) + 1);
          return options[rand].innerHTML;
        });

        // special fields
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
