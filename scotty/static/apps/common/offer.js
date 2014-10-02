define(function() {
  'use strict';
  var stateText = {
    'ACTIVE': 'Active',
    'REJECTED': 'Rejected',
    'ACCEPTED': 'Accept',
    'WITHDRAWN': 'Withdrawn',
    'INTERVIEW': 'Interview',
    'CONTRACT_NEGOTIATION': 'Contract negotiation',
    'CONTRACT_SIGNED': 'Contract signed',
  };

  var validStatus = {
    'ACTIVE': [ 'ACCEPTED', 'REJECTED' ],
    'REJECTED': [],
    'ACCEPTED': [ 'INTERVIEW' ],
    'WITHDRAWN': [],
    'INTERVIEW': [ 'CONTRACT_NEGOTIATION' ],
    'CONTRACT_NEGOTIATION': [ 'CONTRACT_SIGNED' ],
    'CONTRACT_SIGNED': [],
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

    canSign: function() {
      return !this.isFinalStatus();
    },

    accept: function() {
      return this._api.post(this._url() + '/accept', {})
        .then(this._setData);
    },

    sign: function(params) {
      return this._api.post(this._url() + '/signed', params)
        .then(this._setData);
    },

    reject: function(params) {
      return this._api.post(this._url() + '/reject', params)
        .then(this._setData);
    },

    withdraw: function(params) {
      return this._api.post(this._url() + '/withdraw', params)
        .then(this._setData);
    },

    nextStatus: function() {
      return this._api.when(this.getNextStatus()).then(function(valid) {
        if (!valid)
          throw new Error('Status ' + this.data.status + ' hasn\'t next step');
        return this._api.post('/admin/offers/' + this.id + '/status', { status: valid })
          .then(this._updateStatus);
      }.bind(this));
    },

    getNextStatusText: function() {
      return stateText[validStatus[this.data.status][0]] || null;
    },

    dispose: function() {
      // TODO
    },
  };

  return Offer;
});
