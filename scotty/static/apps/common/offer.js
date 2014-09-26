define(function() {
  'use strict';
  var stateText = {
    'ACTIVE': 'Active',
    'REJECTED': 'Rejected',
    'ACCEPTED': 'Accept',
    'INTERVIEW': 'Interview',
    'CONTRACT_SENT': 'Contract sent',
    'CONTRACT_RECEIVED': 'Contract received',
    'CONTRACT_SIGNED': 'Contract signed',
    'JOB_STARTED': 'Job started',
  };

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
    this._parser = function() {};
    this._setData(data);
    this._setData = this._setData.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  Offer.prototype = {
    constructor: Offer,

    _url: function() {
      return this._baseUrl + '/' + this.id;
    },

    _setData: function(response) {
      this.data = response;
      this.status = response.status;
      this.statusText = stateText[response.status];
      this._parser(response, this);
      return this;
    },

    _validState: function(state) {
      return validStatus[this.data.status].indexOf(state) !== -1;
    },

    canAccept: function() {
      return this.status === 'ACTIVE';
    },

    canReject: function() {
      return this.status !== 'REJECTED' &&
        this.status !== 'JOB_STARTED';
    },

    canHire: function() {
      return this.status !== 'ACTIVE' &&
        this.status !== 'REJECTED' &&
        this.status !== 'JOB_STARTED';
    },

    setDataParser: function(parser) {
      this._parser = parser;
      this._parser(this.data, this);
    },

    refresh: function() {
      this._api.get(this._baseUrl).then(this._setData);
    },

    getData: function() {
      return this._api.when(this.data);
    },

    accept: function() {
      return this._api.post(this._url() + '/accept', {})
        .then(this._setData);
    },

    reject: function(params) {
      return this._api.post(this._url() + '/reject', params)
        .then(this._setData);
    },

    hired: function() {
      return this._api.post(this._url() + '/hired', {})
        .then(this._setData);
    },

    getNextStatus: function() {
      return validStatus[this.data.status][0] || null;
    },

    getNextStatusText: function() {
      return stateText[this.getNextStatus()] || null;
    },

    nextStatus: function() {
      return this._api.when(this.getNextStatus()).then(function(valid) {
        if (!valid)
          throw new Error('Status ' + this.data.status + ' hasn\'t next step');
        return this._api.post('/admin/offers/' + this.id + '/status', { status: valid });
      }.bind(this));
    },

    dispose: function() {
      // TODO
    },
  };

  return Offer;
});
