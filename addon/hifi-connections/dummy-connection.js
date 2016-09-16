import Ember from 'ember';

let ClassMethods = Ember.Mixin.create({
  setup() {},
  canPlay: () => true,
  canUseConnection: () => true,
  canPlayExtension: () => true,
});

let DummyConnection = Ember.Object.extend(Ember.Evented, {
  init() {
    Ember.run.next(() => this.trigger('audio-ready'));
  },
  play() {
    this.trigger('audio-played', this);
  },
  pause() {
    this.trigger('audio-paused');
  },
  stop() {
    this.trigger('audio-stopped');
  },
  setPosition() {},
  _currentPosition() {},
  _setVolume(v) {
    this.set('volume', v);
  },
  _audioDuration() {},
});

DummyConnection.reopenClass(ClassMethods);

export default DummyConnection;
