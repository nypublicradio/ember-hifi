'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');    // eslint-disable-line node/no-unpublished-require
var mergeTrees = require('broccoli-merge-trees');  // eslint-disable-line node/no-unpublished-require

module.exports = {
  name: 'ember-hifi',
  included(app, parentAddon) {
    this._super.included.apply(this, arguments);
    var target = parentAddon || app;

    while (target.app && !target.bowerDirectory) {
      target = target.app;
    }

    target.import({
      development: 'vendor/third-party/howler.js',
      production: 'vendor/third-party/howler.min.js'
    });

    target.import({
      development: 'vendor/third-party/hls.js',
      production: 'vendor/third-party/hls.min.js'
    });

    target.import('vendor/howler.js');
    target.import('vendor/hls.js');
  },

  treeForVendor(vendorTree) {
    var howlerTree = new Funnel(path.dirname(require.resolve('howler')), {
      files: ['howler.js', 'howler.min.js'],
      destDir: 'third-party'
    });

    var hlsTree = new Funnel(path.dirname(require.resolve('hls.js')), {
      files: ['hls.js', 'hls.min.js', 'hls.js.map'],
      destDir: 'third-party'
    });

    return mergeTrees([vendorTree, howlerTree, hlsTree]);
  },

  isDevelopingAddon: function() {
    return true;
  }
};
