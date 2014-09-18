define(function() {
  'use strict';

  function Employer(api, id, data) {
    this.id = id;
    this._api = api;
    this._data = data;
  }

  Employer.prototype = {
    constructor: Employer,

    _url: function() {
      return '/employers/' + this.id;
    },

    apply: function(data) {
      return this._api.put(this._url() + '/apply', data).then(function(response) {
        this._data = response;
      }.bind(this));
    },

    updateData: function(model) {
      return this._api.put(this._url(), model);
    },

    getData: function() {
      return this._api.when(this._data || this.refreshData());
    },

    refreshData: function() {
      return this._api.get(this._url()).then(function(response) {
        this._data = response;
        return response;
      }.bind(this), function(request) {
        if (request.status === 403)
          return this.dispose();
        throw request;
      }.bind(this));
    },

    listOffices: function() {
      return this._api.get(this._url() + '/offices');
    },

    addOffice: function(data) {
      return this._api.post(this._url() + '/offices', data);
    },

    removeOffice: function(data) {
      return this._api.delete(this._url() + '/offices/' + data.id);
    },

    getUserData: function() {
      return this.checkSession();
    },

    getSuggestedCandidates: function() {
      return this._api.get(this._url() + '/suggestedcandidates');
    },

    getCandidates: function() {
      return this._api.get(this._url() + '/interestedcandidates');
    },

    getOffers: function() {
      // NOT IMPLEMENTED YET
      return this._api.get('/i-will-fail');
    },

    dispose: function() {
      // TODO
    },
  };

  return Employer;
});
