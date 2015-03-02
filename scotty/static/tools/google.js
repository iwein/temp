define(function() {
  'use strict';
  function executeConversionTracking() {
    var img = document.createElement('img');
    img.style.borderStyle = 'none';
    img.height = '1';
    img.width = '1';
    img.alt = '';
    img.src = '//www.googleadservices.com/pagead/conversion/990844894/?' + [
      'value=250.00',
      'currency_code=EUR',
      'label=a1iQCPvWrlkQ3q-82AM',
      'guid=ON',
      'script=0'
    ].join('&');
    document.body.appendChild(img);
  }

  return {
    executeConversionTracking: executeConversionTracking,
  };
});
