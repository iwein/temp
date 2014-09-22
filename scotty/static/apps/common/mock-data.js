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
          //if (!element.hasAttribute('required'))// && !!random(0, 2))
          //  return set(element, 'ng-model', '');

          set(element, 'ng-model', value);
          get(element, 'ng-change');
          return element;
        });
      }

      function setLocation(selector, property) {
        var setter = $parse(property).assign;
        $(selector + ' input[name=location]').forEach(function(element) {
          set(element, 'ng-model', 'Barcelona, ES');
          setter(getScope(element), {
            city: 'Barcelona',
            country_iso: 'ES',
          });
        });
      }

      var fillForm = window.f = function() {
        setValue('textarea', guid);
        setValue('input[type=checkbox]', true);
        setValue('input[type=text]', guid);
        setValue('input[type=email]', function() {
          if (!localStorage.mockEmail) return;
          if (!localStorage.mockEmailCounter) localStorage.mockEmailCounter = 0;
          return localStorage.mockEmail.replace('%D%', localStorage.mockEmailCounter++);
        });
        setValue('input[type=password]', '123123123');
        setValue('input[type=number]', random.bind(null, 1900, 2100));
        setValue('input[type=dotted-integer]', random.bind(null, 18000, 100001));
        setValue('input[type=url]', document.location.toString());
        setValue('input[type=tel]', function() {
          return '+' + random(1, 100) + ' ' + random(600000000, 700000000);
        });
        setValue('select', function(element) {
          return randomElement(element.children, 1).innerHTML;
        });
        setValue('input[type=date]', function() {
          return moment().format('YYYY-MM-DD');
        });
        setValue('input[name=zipcode]', random.bind(null, 10000, 99999));
        setValue('hc-label-typeahead input', '');

        // special fields

        setValue('form[name=formExperience] hc-label-typeahead', ['asdf','Python']);
        setValue('form[name=formSignupFacts] hc-label-typeahead[name=techTags]', ['asdf','Python']);
        setLocation('form[name=formExperience]', 'model.location');
        setLocation('form[name=formProfile]', 'model.contact_city');
        setLocation('form[name=formSignupBasic]', 'model.address_city');
        setLocation('form[name=formSignupBasicOffice]', 'office.address_city');

        var field = randomElement([ 'date', 'months' ]);
        $('form[name=formTarget] input[name=available_' + field).forEach(function(element) {
          set(element, 'ng-model', '');
        });

        $('form[name=formLanguages]').map(function(element) {
          getScope(element).model.forEach(function(item) {
            if (!item.proficiency) return;
              item.language = randomElement([
'Abkhazian', 'Achinese', 'Acoli', 'Adangme', 'Adyghe; Adygei', 'Afar', 'Afrihili', 'Afrikaans',
'Afro-Asiatic languages', 'Ainu', 'Akan', 'Akkadian', 'Albanian', 'Aleut', 'Algonquian languages', 'Altaic languages',
'Amharic', 'Angika', 'Apache languages', 'Arabic', 'Aragonese', 'Arapaho', 'Arawak', 'Armenian',
'Aromanian; Arumanian; Macedo-Romanian', 'Artificial languages', 'Assamese', 'Asturian; Bable; Leonese; Asturleonese',
'Athapascan languages', 'Australian languages', 'Austronesian languages', 'Avaric', 'Avestan', 'Awadhi', 'Aymara',
'Azerbaijani', 'Balinese', 'Baltic languages', 'Baluchi', 'Bambara', 'Bamileke languages', 'Banda languages',
'Bantu languages', 'Basa', 'Bashkir', 'Basque', 'Batak languages', 'Beja; Bedawiyet', 'Belarusian', 'Bemba', 'Bengali',
'Berber languages', 'Bihari languages', 'Bislama', 'Bokm\u00e5l, Norwegian; Norwegian Bokm\u00e5l', 'Bosnian', 'Braj',
'Bulgarian', 'Buriat', 'Caddo', 'Catalan; Valencian', 'Caucasian languages', 'Cebuano', 'Celtic languages',
'Central American Indian languages', 'Central Khmer', 'Chagatai', 'Chamic languages', 'Chamorro', 'Chibcha',
'Chichewa; Chewa; Nyanja', 'Chinook jargon', 'Chipewyan; Dene Suline', 'Choctaw', 'Church Slavic', 'Chuvash',
'Classical Newari; Old Newari; Classical Nepal Bhasa', 'Classical Syriac', 'Corsican', 'Creoles and pidgins',
'Creoles and pidgins, English based', 'Creoles and pidgins, French-based', 'Creoles and pidgins, Portuguese-based',
'Crimean Tatar; Crimean Turkish', 'Croatian', 'Cushitic languages', 'Dakota', 'Danish', 'Dargwa', 'Delaware', 'Dinka',
'Divehi; Dhivehi; Maldivian', 'Dravidian languages', 'Duala', 'Dutch, Middle (ca.1050-1350)', 'Dyula', 'Dzongkha',
'Eastern Frisian', 'Egyptian (Ancient)']);
            item.errorInvalidLanguage = false;
          });
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
