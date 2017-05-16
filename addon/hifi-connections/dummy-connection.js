import Ember from 'ember';
import BaseSound from './base';

let ClassMethods = Ember.Mixin.create({
  setup() {},
  canPlay: () => true,
  canUseConnection: () => true,
  canPlayMimeType: () => true,
});


let DummyConnection = BaseSound.extend({
  debugName: 'dummyConnection',
  _position: 0,
  setup() {
    let {result} = this.getInfoFromUrl();
    if (result === 'bad') {
      Ember.run.next(() => this.trigger('audio-load-error', this));
    }
    else {
      Ember.run.next(() => this.trigger('audio-ready', this));
    }
  },

  stopTicking: function() {
    Ember.run.cancel(this.tick());
  },

  startTicking: function() {
    this.tick = Ember.run.later(() => {
      this._setPosition((this._currentPosition() || 0) + 100);
      this.startTicking();
    }, 100);
  },

  getInfoFromUrl: function() {
    let [, result, length, name] = this.get('url').split('/');

    return {result, length, name};
  },

  handlePositioningEvents: Ember.observer('_position', function(){
    if (this.get('_position') >= this._audioDuration()) {
      this.trigger('audio-ended', this);
    }
  }),

  play({position} = {}) {
    if (typeof position !== 'undefined') {
      this.set('_position', position);
    }
    this.trigger('audio-played', this);
    this.startTicking();
  },
  pause() {
    this.trigger('audio-paused', this);
    this.stopTicking();
  },
  stop() {
    this.trigger('audio-paused', this);
    this.stopTicking();
  },
  fastForward(duration) {
    this.set('_position', this.get('position') + duration);
  },
  rewind(duration) {
    this.set('_position', this.get('position') - duration);
  },
  _setPosition(duration) {
    this.set('_position', duration);
  },
  _currentPosition() {
    return this.get('_position');
  },
  _setVolume(v) {
    this.set('volume', v);
  },
  _audioDuration() {
    let {result, length} = this.getInfoFromUrl();

    if (result === 'bad') {
      return;
    }

    if (length === 'stream') {
      return Infinity;
    }
    else {
      return parseInt(length, 10);
    }
  },
});

DummyConnection.reopenClass(ClassMethods);

export default DummyConnection;
