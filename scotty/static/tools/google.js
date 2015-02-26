define(function() {
  'use strict';

  function executeConversionTracking() {
    window.google_conversion_id = 990844894;
    window.google_conversion_language = 'en';
    window.google_conversion_format = '3';
    window.google_conversion_color = 'ffffff';
    window.google_conversion_label = 'a1iQCPvWrlkQ3q-82AM';
    window.google_conversion_value = 250.00;
    window.google_conversion_currency = 'EUR';
    window.google_remarketing_only = false;
    requireScript('//www.googleadservices.com/pagead/conversion.js');
  }

  function requireScript(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    document.body.appendChild(script);
  }

  return {
    executeConversionTracking: executeConversionTracking,
  };
});
