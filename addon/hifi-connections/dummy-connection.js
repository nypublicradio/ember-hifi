import Ember from 'ember';
import BaseSound from './base';
let ClassMethods = Ember.Mixin.create({
  setup() {},
  canPlay: () => true,
  canUseConnection: () => true,
  canPlayMimeType: () => true,
  toString() {
    return 'Dummy Connection';
  }
});


let DummyConnection = BaseSound.extend({
  debugName: 'dummyConnection',
  _position: 0,
  _tickInterval: 50,
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
    window.clearTimeout(this.tick);
  },

  startTicking: function() {
    this.tick = window.setTimeout(Ember.run.bind(() => {
      this._setPosition((this._currentPosition() || 0) + this.get('_tickInterval'));
      this.startTicking();
    }), this.get('_tickInterval'))
  },

  getInfoFromUrl: function() {
    let [, result, length, name] = this.get('url').split('/');
    /*eslint no-console: 0 */
    if (!(result && length && name)) {
      console.error('[dummy-connection] url format should be "/:result/:length/:name"');
    }

    if (!(length === 'stream' || parseInt(length) > 0)) {
      console.error('[dummy-connection] url format should be "/:result/:length/:name"');
      console.error(`[dummy-connection] length should be an integer or "stream". Was given ${this.get('url')}`);
    }

    if (!(result === 'good' || result === 'bad')) {
      console.error('[dummy-connection] url format should be "/:result/:length/:name"');
      console.error(`[dummy-connection] status should be 'good' or 'bad'. Was given ${this.get('url')}`);
    }

    return {result, length, name};
  },

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
  _setPosition(duration) {
    duration = Math.max(0, duration);
    duration = Math.min(this._audioDuration(), duration);
    this.set('_position', duration);

    if (duration >= this._audioDuration()) {
      Ember.run.next(() => this.trigger('audio-ended', this));
    }

    return duration;
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
