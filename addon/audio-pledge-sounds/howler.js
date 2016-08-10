import Ember from 'ember';
import BaseSound from './base';
const {
  computed
} = Ember;

export default BaseSound.extend({
  _adapter: 'howler',

  forward() {

  },

  rewind() {

  },

  setPosition(position) {
    this.get("_sound").seek(position);
  }
});
