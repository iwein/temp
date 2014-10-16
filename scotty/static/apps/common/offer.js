define(function() {
  'use strict';
  var stateText = {
    'ACTIVE': 'Active',
    'REJECTED': 'Rejected',
    'ACCEPTED': 'Accept',
    'INTERVIEW': 'Interview',
    'CONTRACT_NEGOTIATION': 'Contract negotiation',
    'CONTRACT_SIGNED': 'Contract signed',
    'WITHDRAWN': 'Withdrawn',
    'EXPIRED': 'Expired',
  };

  var validStatus = {
    'ACTIVE': [ 'ACCEPTED', 'REJECTED' ],
    'REJECTED': [],
    'ACCEPTED': [ 'INTERVIEW' ],
    'INTERVIEW': [ 'CONTRACT_NEGOTIATION' ],
    'CONTRACT_NEGOTIATION': [ 'CONTRACT_SIGNED' ],
    'CONTRACT_SIGNED': [],
    'WITHDRAWN': [],
    'EXPIRED': [],
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
      }, null);
      this.statusText = stateText[this.status];
      return this;
    },

    _validState: function(state) {
      return validStatus[this.data.status].indexOf(state) !== -1;
    },

    setDataParser: function(parser) {
      this._parser = parser;
      this._parser(this.data, this);
    },

    refresh: function() {
      this._api.get(this._url()).then(this._setData);
    },

    getData: function() {
      return this._api.when(this.data);
    },

    isFinalStatus: function() {
      return this.status === 'REJECTED' ||
        this.status === 'WITHDRAWN' ||
        this.status === 'CONTRACT_SIGNED';
    },

    canWithdraw: function() {
      return !this.isFinalStatus();
    },

    canReject: function() {
      return !this.isFinalStatus();
    },

    canAccept: function() {
      return this.status === 'ACTIVE';
    },

    canNextStatus: function() {
      return !this.isFinalStatus() &&
        !this.canAccept() &&
        this.status !== 'CONTRACT_NEGOTIATION';
    },

    canRollback: function() {
      return this.status !== 'ACTIVE' &&
        this.status !== 'EXPIRED';
    },

    canSign: function() {
      return !this.isFinalStatus();
    },

    accept: function(params) {
      return this._api.post(this._url() + '/accept', params)
        .then(this._updateStatus);
    },

    sign: function(params) {
      return this._api.post(this._url() + '/signed', params)
        .then(this._updateStatus);
    },

    reject: function(params) {
      return this._api.post(this._url() + '/reject', params)
        .then(this._updateStatus);
    },

    withdraw: function(params) {
      return this._api.post(this._url() + '/withdraw', params)
        .then(this._updateStatus);
    },

    rollback: function() {
      return this._api.post(this._url() + '/rollback', {})
        .then(this._updateStatus);
    },

    nextStatus: function() {
      return this._api.when(this.getNextStatus()).then(function(valid) {
        if (!valid)
          throw new Error('Status ' + this.data.status + ' hasn\'t next step');
        return this._api.post(this._url() + '/status', { status: valid })
          .then(this._updateStatus);
      }.bind(this));
    },

    getNextStatus: function() {
      if (!validStatus[this.data.status]) debugger;
      return validStatus[this.data.status][0] || null;
    },

    getNextStatusText: function() {
      return stateText[this.getNextStatus()] || null;
    },

    dispose: function() {
      // TODO
    },
  };

  return Offer;
});
