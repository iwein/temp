define(function(require) {
  'use strict';
  require('./sha1');
  var b64_hmac_sha1 = window.b64_hmac_sha1; // imported from './sha1'
  var btoa = window.btoa; // standard
  var conf = require('conf');
  var module = require('app-module');


  function Amazon(config) {
    this._promise = config.promise;
    this._ajax = config.ajax;
    this._AWSSecretKeyId = config.AWSSecretKeyId;
    this._AWSAccessKeyId = config.AWSAccessKeyId;
    this._bucket = config.bucket;
    this._acl = config.acl;
  }

  Amazon.prototype = {
    constructor: Amazon,

    upload: function(file, folder, filename) {
      filename = filename || file.name;
      folder = folder ? folder + '/' : '';
      var key = folder + filename;
      var year = new Date().getFullYear();

      var policyJson = {
        'expiration': year + '-12-12T12:00:00.000Z',
        'conditions': [
          { 'acl': this._acl },
          { 'key': key },
          { 'bucket': this._bucket },
          { 'x-amz-meta-filename': filename },
          [ 'starts-with', '$Content-Type', 'image/' ]
        ]
      };

      var policy = btoa(JSON.stringify(policyJson));
      var signature = b64_hmac_sha1(this._AWSSecretKeyId, policy);

      var fd = new FormData();
      fd.append('AWSAccessKeyId', this._AWSAccessKeyId);
      fd.append('acl', this._acl);
      fd.append('Policy', policy);
      fd.append('Signature', signature);
      fd.append('Content-Type', file.type);
      fd.append('x-amz-meta-filename', filename);
      fd.append('key', key);
      fd.append('file', file);

      return new this._promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '//' + this._bucket + '.s3.amazonaws.com', true);
        xhr.send(fd);
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 204)
              resolve('https://s3-eu-west-1.amazonaws.com/' + this._bucket + '/' + key);
            else
              reject(xhr);
          }
        }.bind(this);
      }.bind(this));
    }
  };


  module.factory('Amazon', function($http, $q) {

    // $q will be this function on next versions
    function PromiseWrapper(resolver) {
      var deferred = $q.defer();
      resolver(deferred.resolve, deferred.reject);
      return deferred.promise;
    }

    return new Amazon({
      promise: PromiseWrapper,
      ajax: $http,
      AWSSecretKeyId: conf.amazon_secret_key,
      AWSAccessKeyId: conf.amazon_access_key,
      bucket: conf.amazon_bucket,
      acl: conf.amazon_acl,
    });
  });

  return Amazon;
});
