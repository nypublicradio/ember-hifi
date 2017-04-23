/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-hifi',
  included(app, parentAddon) {
    this._super.included.apply(this, arguments);
    var target = parentAddon || app;

    while (target.app && !target.bowerDirectory) {
      target = target.app;
    }

    target.import(target.bowerDirectory + '/howler.js/dist/howler.js');
    target.import('vendor/howler.js');

    target.import({
      development: target.bowerDirectory + '/hls.js/dist/hls.js',
      production: target.bowerDirectory + '/hls.js/dist/hls.min.js'
    });
    target.import('vendor/hls.js');
  },

  isDevelopingAddon: function() {
    return true;
  }
};
