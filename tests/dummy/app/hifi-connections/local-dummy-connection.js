import Ember from 'ember';
import BaseSound from 'ember-hifi/hifi-connections/base';

export default BaseSound.extend({
  toString() {
    return 'Local Dummy Connection';
  },

  init           : function() {},
  willDestroy    : function() {},
  currentPosition: function() {},
  play           : function() {},
  pause          : function() {},
  _setVolume     : function() {}
});
