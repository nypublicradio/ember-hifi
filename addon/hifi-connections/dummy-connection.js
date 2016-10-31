import Ember from 'ember';

let ClassMethods = Ember.Mixin.create({
  setup() {},
  canPlay: () => true,
  canUseConnection: () => true,
  canPlayMimeType: () => true,
});

let DummyConnection = Ember.Object.extend(Ember.Evented, {
  position: 0,
  init() {
    Ember.run.next(() => this.trigger('audio-ready'));
  },
  play({position} = {}) {
    if (typeof position !== 'undefined') {
      this.set('position', position);
    }
    this.trigger('audio-played', this);
  },
  pause() {
    this.trigger('audio-paused');
  },
  stop() {
    this.trigger('audio-stopped');
  },
  _setPosition() {},
  _currentPosition() {},
  _setVolume(v) {
    this.set('volume', v);
  },
  _audioDuration() {},
});

DummyConnection.reopenClass(ClassMethods);

export default DummyConnection;
