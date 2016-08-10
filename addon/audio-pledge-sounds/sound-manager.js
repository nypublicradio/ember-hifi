import Ember from 'ember';
import BaseSound from './base';
const {
  computed
} = Ember;

export default BaseSound.extend({
  _adapter: 'sound-manager',

  forward() {

  },

  rewind() {

  },

  setPosition(position) {

  }
});
