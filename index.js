'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'ember-hifi',

  included(app, parentAddon) {
    this._super.included.apply(this, arguments);
    var target = parentAddon || app;

    while (target.app && !target.bowerDirectory) {
      target = target.app;
    }

    this.getHifiConnections();

    if (this.hifiConnections.includes('Howler')) {
      target.import({
        development: 'vendor/third-party/howler.js',
        production: 'vendor/third-party/howler.min.js'
      });

      target.import('vendor/howler.js');
    }

    if (this.hifiConnections.includes('HLS')) {
      target.import({
        development: 'vendor/third-party/hls.js',
        production: 'vendor/third-party/hls.min.js'
      });

      target.import('vendor/hls.js');
    }
  },

  treeForVendor(vendorTree) {
    var trees = [];

    this.getHifiConnections();

    if (vendorTree) {
      trees.push(vendorTree);
    }

    if (this.hifiConnections.includes('Howler')) {
      trees.push(new Funnel(path.dirname(require.resolve('howler')), {
        files: ['howler.js', 'howler.min.js'],
        destDir: 'third-party'
      }));
    }

    if (this.hifiConnections.includes('HLS')) {
      trees.push(new Funnel(path.dirname(require.resolve('hls.js')), {
        files: ['hls.js', 'hls.min.js', 'hls.js.map'],
        destDir: 'third-party'
      }));
    }

    return mergeTrees(trees);
  },

  getHifiConnections: function() {
    if (this.hifiConnections) {
      return;
    }

    this.hifiConnections = this.project.config(process.env.EMBER_ENV).emberHifi.connections.map((connection) => connection.name);
  },

  isDevelopingAddon: function() {
    return true;
  }
};
