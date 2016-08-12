import Ember from 'ember';
const {
  assert
} = Ember;


const ClassMethods = Ember.Mixin.create({
  setup() {
  }
});

let Sound = Ember.Object.extend(Ember.Evented, {
  play() {
    assert("[audio-pledge] interface not implemented", false);
  },

  pause() {
    assert("[audio-pledge] interface not implemented", false);
  },

  stop() {
    assert("[audio-pledge] interface not implemented", false);
  },

  forward() {
    assert("[audio-pledge] interface not implemented", false);
  },

  rewind() {
    assert("[audio-pledge] interface not implemented", false);
  },

  setPosition(position) {
    assert("[audio-pledge] interface not implemented", false);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
