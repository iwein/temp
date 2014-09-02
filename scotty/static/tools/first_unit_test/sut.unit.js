define(function(require) {
	'use strict';
	var sut = require('./sut.js');

	describe('Dummy sut so we have a unit test', function() {
		it('should be one', function() {
			expect(sut).toBe(1);
		});
	});
});
