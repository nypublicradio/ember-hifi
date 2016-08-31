import Ember from 'ember';
import BaseSound from 'audio-pledge/audio-pledge-factories/base';

export default BaseSound.extend({
  toString() {
    return 'Local Dummy Factory';
  },

  init: Ember.K,
  willDestroy: Ember.K
});
