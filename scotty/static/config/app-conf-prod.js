(function(factory) {
  'use strict';
  if (typeof define === 'function')
    define(factory);
  else
    module.exports = factory();
})(function() {
  'use strict';
  return {
    'amazon_bucket': 'scotty-prod',
    'amazon_secret_key': 'xWdmpQ8bVSRyDkJ6BLD8i9EUnYWkt8CJ0QjREcD5',
    'amazon_access_key': 'AKIAI72PUNP77JJ4YMFA',
    'amazon_acl': 'public-read',
    'api_url': 'http://scotty-prod.herokuapp.com/api/',
    'admin_key': '6b23dd93c33e4100ce9332eff5df6e7b01e5a289681cdff',
    'support_email': 'service@4scotty.com',
    'ga_id': 'UA-22621022-14'
  };
});
