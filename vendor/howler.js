(function() {
  function generateModule(name, values) {
    define(name, [], function() {
      'use strict';

      return values;
    });
  }

  generateModule('howler', {
    'default': Howl,
    'Howler': Howler,
    'Howl': Howl,
    'Sound': Sound
  });
})();
