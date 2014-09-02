/*globals describe, it, browser, expect */
'use strict';

describe('Home component', function() {
  it('should have a title', function() {
    browser.get('http://localhost/static/public/candidate.html');
    expect(browser.getTitle()).toEqual('Scotty - Candidate');
  });
});
