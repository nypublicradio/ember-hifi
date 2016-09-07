/* jshint node: true */
'use strict';

module.exports = {
  name: 'audio-pledge',
  included(app) {
    this._super.included(app);

    app.import(app.bowerDirectory + '/howler.js/dist/howler.js');
    app.import('vendor/howler.js');

    app.import({
      development: app.bowerDirectory + '/hls.js/dist/hls.js',
      production: app.bowerDirectory + '/hls.js/dist/hls.min.js'
    });
    app.import('vendor/hls.js');
  },

  isDevelopingAddon: function() {
    return true;
  }
};
