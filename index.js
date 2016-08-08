/* jshint node: true */
'use strict';

module.exports = {
  name: 'audio-pledge',
  included(app) {
    this._super.included(app);
    app.import(app.bowerDirectory + '/howler.js/dist/howler.js');
    app.import('vendor/howler.js');
  },

  isDevelopingAddon: function() {
    return true;
  }
};
