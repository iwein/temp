/* globals addStepDefinitions */
/* exported stepDefinitions */

function stepDefinitions(callback) {
  'use strict';

  function wrapPromise(context, callback, code, args) {
    var response;

    try {
      response = code.apply(context, args);
    } catch(error) {
      callback(error);
      throw error;
    }

    if (response && response.then)
      response.then(function() { callback(); }, callback);
    else
      callback();

    return response;
  }

  function wrapHook(fn) {
    return function(code) {
      return fn.call(this, function(callback) {
        return wrapPromise(this, callback, code, []);
      });
    };
  }


  function wrapStep(fn) {
    return function(name, code) {
      var self = this;
      this._steps[name] = code;
      return fn.call(this, name, function() {
        self._world = this;
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        return wrapPromise(this, callback, code, args);
      });
    };
  }


  addStepDefinitions(function(scenario) {
    var wrapper = {
      Around: wrapHook(scenario.Around),
      Before: wrapHook(scenario.Before),
      After: wrapHook(scenario.After),
      Given: wrapStep(scenario.Given),
      Then: wrapStep(scenario.Then),
      When: wrapStep(scenario.When),
      defineStep: wrapStep(scenario.defineStep),
      _steps: {},
      step: function(name, args) {
        if (!(name in this._steps))
          console.error('Unkown step', name);
        return this._steps[name].apply(this._world, args);
      },
    };

    var result = callback(wrapper);

    if (wrapper.World) {
      scenario.World = function WorldWrapper(callback) {
        wrapPromise(this, callback, wrapper.World, []);
      };
      scenario.World.prototype = wrapper.World.prototype;
    }

    return result;
  });
}
