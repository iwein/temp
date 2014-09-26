define(function() {
  'use strict';

  var validStatus = {
    'ACTIVE': [ 'ACCEPTED', 'REJECTED' ],
    'REJECTED': [],
    'ACCEPTED': [ 'INTERVIEW' ],
    'INTERVIEW': [ 'CONTRACT_SENT' ],
    'CONTRACT_SENT': [ 'CONTRACT_RECEIVED' ],
    'CONTRACT_RECEIVED': [ 'CONTRACT_SIGNED' ],
    'CONTRACT_SIGNED': [ 'JOB_STARTED' ],
    'JOB_STARTED': [],
  };

  function Offer(api, baseUrl, data) {
    this.id = data.id;
    this._api = api;
    this._baseUrl = baseUrl;
    this._data = data;
    this._setData = this._setData.bind(this);
  }

  Offer.prototype = {
    constructor: Offer,

    _url: function() {
      return this._baseUrl + '/me' + this.id;
    },

    _setData: function(response) {
      this._data = response;
      return response;
    },

    _validState: function(state) {
      return validStatus[this._data.status].indexOf(state) !== -1;
    },

    getData: function() {
      return this._api.when(this._data);
    },

    accept: function() {
      return this._api.post(this._url() + '/accept', {})
        .then(this._setData);
    },

    reject: function(reason) {
      return this._api.post(this._url() + '/reject', { reason: reason })
        .then(this._setData);
    },

    getNextStatus: function() {
      return validStatus[this._data.status][0] || null;
    },

    nextStatus: function() {
      return this._api.when(this.getNextStatus()).then(function(valid) {
        if (!valid)
          throw new Error('Status ' + this._data.status + ' hasn\'t next step');
        return this._api.post('/admin/offers/' + this.id + '/status', { status: valid });
      }.bind(this));
    },

    dispose: function() {
      // TODO
    },
  };

  return Offer;
});
