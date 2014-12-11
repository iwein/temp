define(function(require) {
  'use strict';
  var config = require('conf');
  var header = require('text!./header.html');
  var footer = require('text!../common/footer.html');
  var $header = document.querySelector('#header-container');
  var $footer = document.querySelector('#footer-container');

  if ($header)
    $header.innerHTML = header;

  if ($footer) {
    $footer.innerHTML = footer;

    $$('.foot-item a', $footer).forEach(function(link) {
      link.setAttribute('href', link.getAttribute('href').replace('../', ''));
    });
  }


  return {
    config: config,
    request: request,
    loadContent: loadContent
  };


  function $$(selector, parent) {
    parent = parent || document;
    var slice = Array.prototype.slice;
    var items = parent.querySelectorAll(selector);
    return slice.call(items);
  }

  function request(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.withCredentials = true;
    xhr.send(null);
    xhr.addEventListener('readystatechange', function() {
      if (xhr.readyState !== 4) return null;
      callback(JSON.parse(xhr.responseText));
    });
  }

  function loadContent(bindings) {
    var url = config.api_url + 'v1/cms/get?keys=';
    request(url + Object.keys(bindings).join(','), function(response) {
        response.forEach(function(item) {
            var element = document.querySelector('.' + bindings[item.key]);
            element.innerHTML = item.value;
        });
    });
  }
});
