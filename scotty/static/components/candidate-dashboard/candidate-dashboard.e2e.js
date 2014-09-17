/*globals describe, it, browser, expect */
'use strict';

describe('Dashboard component', function() {
  it('should have a title', function() {
    browser.get('http://localhost/static/apps/candidate/');
    expect(browser.getTitle()).toEqual('Scotty - Candidate');
  });
});
