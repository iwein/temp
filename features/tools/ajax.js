(function() {
  'use strict';
  request.get = get;
  request.put = put;
  request.post = post;
  request.delete = del;
  request.server = 'http://sheltered-meadow-1359.herokuapp.com/api/v1';
  window.AJAX = request;


  function get(url, params, options) {
    options = options || {};
    options.params = params;
    return request('GET', url, options);
  }

  function put(url, body, options) {
    options = options || {};
    options.body = body;
    return request('PUT', url, options);
  }

  function post(url, body, options) {
    options = options || {};
    options.body = body;
    return request('POST', url, options);
  }

  function del(url, options) {
    return request('DELETE', url, options);
  }


  function request(method, url, options) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var path = addUrlParams(url, options.params);
      xhr.open(method, request.server + path);

      if (options.body)
        xhr.setRequestHeader('Content-Type', 'application/json');

      setHeaders(xhr, options.headers);
      xhr.send(getBody(options.body));

      xhr.addEventListener('readystatechange', function() {
        if (xhr.readyState !== 4) return null;
        if (Math.floor(xhr.status / 100) === 2)
          resolve(JSON.stringify(xhr.responseText));
        else
          reject(xhr);
      });
    });
  }


  function addUrlParams(url, params) {
    if (!params) return url;
    var list = Object.keys(params).map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    });
    return url + '?' + list.join('&');
  }

  function setHeaders(xhr, headers) {
    if (!headers) return;
    Object.keys(headers).forEach(function(key) {
      xhr.setRequestHeader(key, headers[key]);
    });
  }

  function getBody(body) {
    if (!body) return null;
    return JSON.stringify(body);
  }

})();