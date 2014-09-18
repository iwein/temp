define(function() {
  'use strict';

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
      return this._api.when(this._data || this.refreshData());
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

    getTargetPositions: getHelper('target_positions'),
    addTargetPosition: setHelper('target_positions', 'post'),
    deleteTargetPosition: deleteHelper('target_positions'),

    getExperience: getHelper('work_experience'),
    addExperience: setHelper('work_experience', 'post'),
    deleteExperience: deleteHelper('work_experience'),

    getEducation: getHelper('education'),
    addEducation: setHelper('education', 'post'),
    deleteEducation: deleteHelper('education'),

    getBookmarks: getHelper('bookmarks'),
    addBookmark: setHelper('bookmarks', 'post'),
    deleteBookmark: deleteHelper('bookmarks'),

    setPreferredCities: setHelper('preferred_cities', 'put'),
    setSkills: setHelper('skills', 'put'),
    setLanguages: setHelper('languages', 'put'),


    getOffers: function() {
      return this._api.get(this._url() + '/offers');
    },
    getOffer: function(id) {
      return this._api.get(this._url() + '/offers/' + id);
    },

    dispose: function() {
      // TODO
    },
  };

  return Candidate;
});
