define(function(require) {
  'use strict';
  var btoa = window.btoa;
  var b64_hmac_sha1 = require('b64_hmac_sha1');
  var module = require('app-module');


  function Amazon(config) {
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
      var contentType = 'image/';

      var policyJson = {
        'expiration': year + '-12-12T12:00:00.000Z',
        'conditions': [
          [ 'eq', '$bucket', this._bucket ],
          [ 'starts-with', '$key', key ],
          { 'acl': this._acl },
          { 'x-amz-meta-filename': filename },
          [ 'starts-with', '$Content-Type', contentType ]
        ]
      };

      var policy = btoa(JSON.stringify(policyJson));
      var signature = b64_hmac_sha1(this._AWSSecretKeyId, policy);

      var fd = new FormData();
      fd.append('AWSAccessKeyId', this._AWSAccessKeyId);
      fd.append('acl', this._acl);
      fd.append('Policy', policy);
      fd.append('Signature', signature);
      fd.append('Content-Type', "multipart/form-data");
      fd.append('x-amz-meta-filename', filename);
      fd.append('key', key);
      fd.append('file', file);

      return this._ajax.post('//' + this._bucket + '.s3.amazonaws.com', fd).then(function() {
        return 'https://s3-eu-west-1.amazonaws.com/' + this._bucket + '/' + key;
      });
    }
  };


  module.factory('Amazon', function($http) {
    return new Amazon({
      ajax: $http,
      AWSSecretKeyId: 'xWdmpQ8bVSRyDkJ6BLD8i9EUnYWkt8CJ0QjREcD5',
      AWSAccessKeyId: 'AKIAI72PUNP77JJ4YMFA',
      bucket: 'scotty-demo',
      acl: 'public'
    });
  });

  return Amazon;
});
