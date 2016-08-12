import Ember from 'ember';

const {
  A:emberArray
} = Ember;

export default Ember.Object.extend({
  init() {
    this.set('sounds', emberArray());
  },

  register(sound) {
    let sounds = this.get("sounds");
    sound.on('audio-played', () => this.pauseAll(sound));
    sounds.pushObject(sound);
  },

  pauseAll(sound) {
    this.get('sounds').without(sound).forEach(this._pauseSound);
  },

  _pauseSound(s) { s.pause(); }

});
