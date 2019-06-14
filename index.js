'use strict';

module.exports = {
  name: 'ember-hifi',
  options: {
    autoImport: {
      alias: {
        'hls': 'hls.js/dist/hls.js'
      }
    },
    babel: {
      plugins: [
      
      ]
    }
  },
  isDevelopingAddon: function() {
    return true;
  }
};
