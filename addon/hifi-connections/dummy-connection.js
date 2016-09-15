import Ember from 'ember';

let DummySound = Ember.Object.extend(Ember.Evented, {
  play() {
    this.trigger('audio-played', this);
  },
  pause() {

  },
  currentPosition() {},
  _setVolume(v) {
    console.log(`setting volume to ${v}`);
    this.set('volume', v);
  }
});

export default DummySound;
