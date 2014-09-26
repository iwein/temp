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
    this._updateStatus = this._updateStatus.bind(this);
    this._setData = this._setData.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  Offer.prototype = {
    constructor: Offer,

    _url: function() {
      return this._baseUrl;
    },

    _setData: function(response) {
      this.data = response;
      this.status = response.status;
      this.statusText = stateText[this.status];
      this._parser(response, this);
      return this;
    },

    _updateStatus: function(response) {
      this.status = this.data.status = response.reduce(function(value, current) {
        return current.completed ? current.status : value;
      });
      this.statusText = stateText[this.status];
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
        .then(this._updateStatus);
    },

    reject: function(params) {
      return this._api.post(this._url() + '/reject', params)
        .then(this._updateStatus);
    },

    hired: function() {
      return this._api.post(this._url() + '/hired', {})
        .then(this._updateStatus);
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
        return this._api.post('/admin/offers/' + this.id + '/status', { status: valid })
        .then(this._updateStatus);
      }.bind(this));
    },

    dispose: function() {
      // TODO
    },
  };

  return Offer;
});
