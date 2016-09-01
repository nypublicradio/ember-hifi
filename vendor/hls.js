(function() {
  /* globals define, Hls */

  function generateModule(name, values) {
    define(name, [], function() {
      'use strict';

      return values;
    });
  }

  generateModule('hls', { 'default': Hls});
})();
