define(function(require) {
  'use strict';

  function LoginRequiredError() { Error.apply(this, arguments) }
  LoginRequiredError.prototype = Object.create(Error.prototype);

  function SignupRequiredError() { Error.apply(this, arguments) }
  SignupRequiredError.prototype = Object.create(Error.prototype);

  function ActivationRequiredError() { Error.apply(this, arguments) }
  ActivationRequiredError.prototype = Object.create(Error.prototype);

  function Permission(session, window, location, translate, alert) {
    this._session = session;
    this._window = window;
    this._location = location;
    this._tr = translate;
    this._alert = alert;
  }

  Permission.prototype = {
    constructor: Permission,

    requireLogged: function() {
      // this renaming is necessary to translated string extraction
      var gettext = this._tr;

      return this._session.checkSession().then(function(hasSession) {
        if (hasSession) return true;
        this._alert.warning(gettext('You need to be logged in to see this page'));
        window.location = '../login.html';
        throw new LoginRequiredError('Login required');
      }.bind(this), function(error) {
        this._alert.defaultError();
        throw error;
      }.bind(this));
    },

    requireSignup: function() {
      // this renaming is necessary to translated string extraction
      var gettext = this._tr;

      return this.requireLogged().then(function() {
        return this._session.isSignupComplete().catch(function(error) {
          this._alert.defaultError();
          throw error;
        });
      }.bind(this)).then(function(isComplete) {
        if (isComplete) return true;
        this._alert.warning(gettext('You need complete signup process to see this page.'));
        this._location.go('signup');
        throw new SignupRequiredError('Signup required');
      }.bind(this));
    },

    requireApproved: function() {
      // this renaming is necessary to translated string extraction
      var gettext = this._tr;

      return this.requireLogged().then(function() {
        if (this._session.isApproved) return true;
        this._alert.warning(gettext('You need be approved to see this page.'));
        this._location.go('signup');
        throw new ActivationRequiredError('Login required');
      }.bind(this));
    }
  };

  Permission.LoginRequiredError = LoginRequiredError;
  Permission.SignupRequiredError = SignupRequiredError;
  Permission.ActivationRequiredError = ActivationRequiredError;

  var module = require('app-module');
  module.factory('Permission', function($window, $state, gettext, toaster, Session) {
    return new Permission(Session, $window, $state, gettext, toaster);
  });

  return Permission;
});
