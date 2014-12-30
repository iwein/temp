define(function(require) {
  'use strict';
  var Candidate = require('./candidate');
  var Offer = require('./offer');


  function Employer(api, id, data, sufix) {
    this.id = data ? data.id : null;
    this.key = id || 'me';
    this._api = api;
    this._data = data;
    this._sufix = sufix || '';

    this.isBookmarked = data.bookmarked_by_candidate;
  }

  Employer.prototype = {
    constructor: Employer,

    _url: function() {
      return '/employers/' + this.key;
    },

    apply: function(data) {
      return this._api.put(this._url() + '/apply' + this._sufix, data).then(function(response) {
        this._data = response;
      }.bind(this));
    },

    updateData: function(model) {
      return this._api.put(this._url() + this._sufix, model);
    },

    getData: function() {
      return this._api.when(this._data || this.refreshData());
    },

    refreshData: function() {
      return this._api.get(this._url() + this._sufix).then(function(response) {
        this._data = response;
        return response;
      }.bind(this), function(request) {
        if (request.status === 403)
          return this.dispose();
        throw request;
      }.bind(this));
    },

    listOffices: function() {
      return this._api.get(this._url() + '/offices' + this._sufix);
    },

    setOffices: function(offices) {
      return this._api.put(this._url() + '/offices' + this._sufix, offices);
    },

    addOffice: function(data) {
      return this._api.post(this._url() + '/offices' + this._sufix, data);
    },

    removeOffice: function(data) {
      return this._api.delete(this._url() + '/offices/' + data.id + this._sufix);
    },

    editOffice: function(data) {
      return this._api.put(this._url() + '/offices/' + data.id + this._sufix, data);
    },

    getUserData: function() {
      return this.checkSession();
    },

    getTimeline: function() {
      return this._api.get(this._url() + '/newsfeed' + this._sufix);
    },

    getSuggestedCandidates: function() {
      var api = this._api;
      return api.get(this._url() + '/suggestedcandidates' + this._sufix).then(function(response) {
        return response.map(function(data) {
          return new Candidate(api, data.id, data);
        });
      });
    },
    getCandidates: function() {
      var api = this._api;
      return api.get(this._url() + '/interestedcandidates' + this._sufix).then(function(response) {
        return response.map(function(data) {
          return new Candidate(api, data.id, data);
        });
      });
    },

    getOffers: function() {
      var url = this._url() + '/offers';
      return this._api.get(url + this._sufix).then(function(offers) {
        return offers.map(function(data) {
          return new Offer(this._api, url + '/' + data.id, data, this._sufix);
        }.bind(this));
      }.bind(this));
    },
    getOffer: function(id) {
      // This call uses /candidates/<ID>/ instead of /candidates/me/
      //   so it can validate the offer belongs to the user.
      var url = this._url() + '/offers/' + id;
      return this._api.get(url + this._sufix).then(function(data) {
        return new Offer(this._api, url, data, this._sufix);
      }.bind(this));
    },
    makeOffer: function(data) {
      var url = this._url() + '/offers';
      return this._api.post(url + this._sufix, data).then(function(data) {
        return new Offer(this._api, url + '/' + data.id, data, this._sufix);
      }.bind(this));
    },

    dispose: function() {
      // TODO
    },
  };


  return Employer;
});
