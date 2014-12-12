define(function() {
  'use strict';
  var stateText = {
    'ACTIVE': 'Active',
    'REJECTED': 'Rejected',
    'ACCEPTED': 'Accept',
    'INTERVIEW': 'Interviewed',
    'CONTRACT_NEGOTIATION': 'Contract Negotiating',
    'CONTRACT_SIGNED': 'Contract Signed',
    'WITHDRAWN': 'Withdrawn',
    'EXPIRED': 'Expired'
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

  function Offer(api, baseUrl, data, sufix) {
    this.id = data.id;
    this._api = api;
    this._baseUrl = baseUrl;
    this._sufix = sufix || '';
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
      this._api.get(this._url() + this._sufix).then(this._setData);
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
      return this.status !== 'ACTIVE';
    },

    canSign: function() {
      return this.status === 'CONTRACT_NEGOTIATION';
    },

    accept: function(params) {
      return this._api.post(this._url() + '/accept' + this._sufix, params)
        .then(this._updateStatus);
    },

    sign: function(params) {
      return this._api.post(this._url() + '/signed' + this._sufix, params)
        .then(this._updateStatus);
    },

    reject: function(params) {
      return this._api.post(this._url() + '/reject' + this._sufix, params)
        .then(this._updateStatus);
    },

    withdraw: function(params) {
      return this._api.post(this._url() + '/withdraw' + this._sufix, params)
        .then(this._updateStatus);
    },

    rollback: function() {
      return this._api.post(this._url() + '/rollback' + this._sufix, {})
        .then(this._updateStatus);
    },

    nextStatus: function() {
      return this._api.when(this.getNextStatus()).then(function(valid) {
        if (!valid)
          throw new Error('Status ' + this.data.status + ' hasn\'t next step');
        return this._api.post(this._url() + '/status' + this._sufix, { status: valid })
          .then(this._updateStatus);
      }.bind(this));
    },

    getNextStatus: function() {
      return validStatus[this.data.status][0] || null;
    },

    getNextStatusText: function() {
      return stateText[this.getNextStatus()] || null;
    },

    getTimeline: function() {
      return this._api.get(this._url() + '/timeline' + this._sufix);
    },

    dispose: function() {
      // TODO
    },
  };

  return Offer;
});
