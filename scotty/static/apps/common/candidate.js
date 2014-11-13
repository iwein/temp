define(function(require) {
  'use strict';
  var Offer = require('./offer');


  function getHelper(key) {
    return function() {
      return this._api.get(this._url() + '/' + key);
    };
  }
  function setHelper(key, method) {
    return function(data) {
      return this._api[method](this._url() + '/' + key, data);
    };
  }
  function deleteHelper(key) {
    return function(data) {
      return this._api.delete(this._url() + '/' + key + '/' + data.id);
    };
  }


  function Candidate(api, id, data) {
    this.id = data ? data.id : null;
    this.key = id || 'me';
    this._api = api;
    this._data = data;
  }

  Candidate.prototype = {
    constructor: Candidate,

    _url: function() {
      return '/candidates/' + this.key;
    },

    updateData: function(model) {
      return this._api.put(this._url(), model);
    },

    getData: function() {
      return this.refreshData();
    },

    refreshData: function() {
      return this._api.get(this._url()).then(function(response) {
        this._data = response;
        this.id = response.id;
        return response;
      }.bind(this), function(request) {
        if (request.status === 403)
          return this.dispose();
        throw request;
      }.bind(this));
    },

    setPhoto: function(photo) {
      return this._api.post(this._url() + '/picture', { url: photo });
    },

    delete: function() {
      return this._api.delete(this._url());
    },

    getExperience: getHelper('work_experience'),
    setExperience: setHelper('work_experience', 'put'),
    addExperience: setHelper('work_experience', 'post'),
    deleteExperience: deleteHelper('work_experience'),

    getEducation: getHelper('education'),
    setEducation: setHelper('education', 'put'),
    addEducation: setHelper('education', 'post'),
    deleteEducation: deleteHelper('education'),

    getBookmarks: getHelper('bookmarks'),
    addBookmark: setHelper('bookmarks', 'post'),
    deleteBookmark: deleteHelper('bookmarks'),

    getTargetPosition: getHelper('target_position'),
    setTargetPosition: setHelper('target_position', 'post'),

    setPreferredLocations: setHelper('preferred_locations', 'put'),
    setSkills: setHelper('skills', 'put'),
    setLanguages: setHelper('languages', 'put'),

    getNewsFeed: getHelper('newsfeed'),
    getSuggestedCompanies: getHelper('suggested_companies'),

    setCVUrl: function(url) {
      return this.updateData({ cv_upload_url: url });
    },

    getOffers: function() {
      var url = this._url() + '/offers';
      return this._api.get(url).then(function(offers) {
        return offers.map(function(data) {
          return new Offer(this._api, url + '/' + data.id, data);
        }.bind(this));
      }.bind(this));
    },
    getOffer: function(id) {
      // This call uses /candidates/<ID>/ instead of /candidates/me/
      //   so it can validate the offer belongs to the user.
      var url = '/candidates/' + this.id + '/offers/' + id;
      return this._api.get(url).then(function(data) {
        return new Offer(this._api, url, data);
      }.bind(this));
    },

    getLastPosition: function() {
      return this._api.when(this._data.work_experience || this.getExperience())
        .then(function(experience) { return experience[experience.length - 1] });
    },

    dispose: function() {
      // TODO
    },
  };

  return Candidate;
});
