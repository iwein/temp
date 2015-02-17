(function(factory) {
  'use strict';
  if (typeof define === 'function')
    define(factory);
  else if (typeof module !== 'undefined')
    module.exports = factory();
  else
    window.config = factory();
})(function() {
  'use strict';
  return {
    'amazon_bucket': 'scotty-dev',
    'amazon_secret_key': 'xWdmpQ8bVSRyDkJ6BLD8i9EUnYWkt8CJ0QjREcD5',
    'amazon_access_key': 'AKIAI72PUNP77JJ4YMFA',
    'amazon_acl': 'public-read',
    'api_url': 'http://sheltered-meadow-1359.herokuapp.com/api/',
    'support_email': 'service@4scotty.com',
    'ga_id': 'UA-XXXXXXXX-X'
    //'api_url': 'http://127.0.0.1:8880/api/'
  };
});
