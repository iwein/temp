define(function(require) {
  'use strict';
  var Offer = require('./offer');
  var levels = {
    'null': 0,
    'undefined': 0,
    'basic': 1,
    'advanced': 2,
    'expert': 3,
  };


  function getHelper(key) {
    return function() {
      return this._api.get(this._url() + '/' + key + this._sufix);
    };
  }
  function setHelper(key, method) {
    return function(data) {
      return this._api[method](this._url() + '/' + key + this._sufix, data);
    };
  }
  function deleteHelper(key) {
    return function(data) {
      return this._api.delete(this._url() + '/' + key + '/' + data.id + this._sufix);
    };
  }


  function Candidate(api, id, data, sufix) {
    this.id = data ? data.id : null;
    this.key = id || 'me';
    this._api = api;
    this._data = data;
    this._sufix = sufix || '';
    if (data) this._sortSkills();
  }

  Candidate.prototype = {
    constructor: Candidate,

    _url: function() {
      return '/candidates/' + this.key;
    },

    _sortSkills: function() {
      this._data.skills = this._data.skills.sort(function(a, b) {
        var order = levels[b.level] - levels[a.level];
        if (order !== 0) return order;
        if (b.skill < a.skill) return 1;
        if (a.skill < b.skill) return -1;
        return 0;
      });
    },

    updateData: function(model) {
      return this._api.put(this._url() + this._sufix, model);
    },

    getData: function() {
      return this.refreshData();
    },

    refreshData: function() {
      return this._api.get(this._url() + this._sufix).then(function(response) {
        this._data = response;
        this.id = response.id;
        this._sortSkills();
        return response;
      }.bind(this), function(request) {
        if (request.status === 403)
          return this.dispose();
        throw request;
      }.bind(this));
    },

    setPhoto: function(photo) {
      return this._api.post(this._url() + '/picture' + this._sufix, { url: photo });
    },

    delete: function() {
      return this._api.delete(this._url() + this._sufix);
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
      return this._api.get(url + this._sufix).then(function(offers) {
        return offers.map(function(data) {
          return new Offer(this._api, url + '/' + data.id, data, this._sufix);
        }.bind(this));
      }.bind(this));
    },
    getOffer: function(id) {
      // This call uses /candidates/<ID>/ instead of /candidates/me/
      //   so it can validate the offer belongs to the user.
      var url = '/candidates/' + this.id + '/offers/' + id;
      return this._api.get(url + this._sufix).then(function(data) {
        return new Offer(this._api, url, data, this._sufix);
      }.bind(this));
    },

    getLastPosition: function() {
      return this._api.when(this._data.work_experience || this.getExperience())
        .then(function(experience) {
          experience.forEach(function(entry) {
            entry.startDate = new Date(entry.start);
          });

          return experience.sort(function(a, b) {
            if (a.end && !b.end) return 1;
            if (b.end && !a.end) return -1;
            return b.startDate - a.startDate;
          })[0];
        });
    },

    getHighestDegree: function() {
      return this.getEducation().then(function(education) {
        var entry = education.sort(function(a, b) {
          if (a.end && !b.end) return -1;
          if (b.end && !a.end) return 1;
          if (a.degree && !b.degree) return -1;
          if (b.degree && !a.degree) return 1;
          return b.end - a.end;
        })[0];
        return entry&&(entry.degree || entry.end) || '';
      });
    },

    setSignupData: function(model) {
      return this._api.post(this._url(), model);
    },

    dispose: function() {
      // TODO
    },
  };

  return Candidate;
});
