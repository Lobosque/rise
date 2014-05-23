var should = require('chai').should();
var _ = require('lodash');
var Rise = require('../js/lib/rise.js').Rise;

describe('Helpers', function() {
  describe('UrlToArray', function() {
    it('should deal with no params at all', function(done) {
      var ret = Rise.helpers.UrlToArray('');
      console.log(ret);
    });
  });
});
