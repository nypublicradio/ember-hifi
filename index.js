/* jshint node: true */
'use strict';

module.exports = {
  name: 'audio-pledge',
  included(app) {
    this._super.included(app);

    app.import(app.bowerDirectory + '/howler.js/dist/howler.js');
    app.import('vendor/howler.js');

    app.import({
      development: app.bowerDirectory + '/soundmanager/swf/soundmanager2_debug.swf',
      production: app.bowerDirectory + '/soundmanager/swf/soundmanager2.swf'
    });
    app.import({
      development: app.bowerDirectory + '/soundmanager/script/soundmanager2.js',
      production: app.bowerDirectory + '/soundmanager/script/soundmanager2-nodebug-jsmin.js'
    });
    app.import(app.bowerDirectory + '/ember-cli-soundmanager-shim/soundmanager2-shim.js', {
      exports: {
        soundManager: ['default']
      }
    });
  },

  isDevelopingAddon: function() {
    return true;
  }
};
