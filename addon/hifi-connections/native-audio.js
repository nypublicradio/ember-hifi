import Ember from 'ember';
import BaseSound from './base';

let ClassMethods = Ember.Mixin.create({
  canPlayMimeType(mimeType) {
    let audio = new Audio();
    // it returns "probably" and "maybe". Both are worth trying. Empty is bad.
    return (audio.canPlayType(mimeType) !== "");
  },

  toString() {
    return 'Native Audio';
  }
});

let Sound = BaseSound.extend({
  setup() {
    let audio = this.get('audioElement');
    if (!audio) {
      audio = document.createElement('audio');
    }

    this.set('audio', audio);
    this._registerEvents();
    audio.src = this.get('url');
    audio.load();
  },

  _registerEvents() {
    let audio = this.get('audio');

    Ember.$(audio).on('canplay',         ()  => this._handleAudioEvent('canplay'));
    Ember.$(audio).on('canplaythrough',  ()  => this._handleAudioEvent('canplaythrough'));
    Ember.$(audio).on('error',           (e) => this._handleAudioEvent('error', e));
    Ember.$(audio).on('playing',         ()  => this._handleAudioEvent('playing'));
    Ember.$(audio).on('pause',           ()  => this._handleAudioEvent('pause'));
    Ember.$(audio).on('durationchange',  ()  => this._handleAudioEvent('durationchange'));
    Ember.$(audio).on('ended',           ()  => this._handleAudioEvent('ended'));
    Ember.$(audio).on('progress',        (e) => this._handleAudioEvent('progress', e));
  },

  _unregisterEvents() {
    let audio = this.get('audio');

    Ember.$(audio).off('canplay',         ()  => this._handleAudioEvent('canplay'));
    Ember.$(audio).off('canplaythrough',  ()  => this._handleAudioEvent('canplaythrough'));
    Ember.$(audio).off('error',           (e) => this._handleAudioEvent('error', e));
    Ember.$(audio).off('playing',         ()  => this._handleAudioEvent('playing'));
    Ember.$(audio).off('pause',           ()  => this._handleAudioEvent('pause'));
    Ember.$(audio).off('durationchange',  ()  => this._handleAudioEvent('durationchange'));
    Ember.$(audio).off('ended',           ()  => this._handleAudioEvent('ended'));
    Ember.$(audio).off('progress',        (e) => this._handleAudioEvent('progress', e));
  },

  _handleAudioEvent(eventName, e) {
    switch(eventName) {
      case 'canplay':
        this._onAudioReady();
        break;
      case 'error':
        this._onAudioError(e);
        break;
      case 'playing':
        this._onAudioPlayed();
        break;
      case 'pause':
        this._onAudioPaused();
        break;
      case 'durationchange':
        this._onAudioDurationChanged();
        break;
      case 'ended':
        this._onAudioEnded();
        break;
      case 'progress':
        this._onAudioProgress(e);
        break;
    }
  },

  _onAudioProgress() {
    this.trigger('audio-loading', this._calculatePercentLoaded());
  },

  _onAudioDurationChanged() {
    this.trigger('audio-duration-changed', this);
  },

  _onAudioPlayed() {
    this.trigger('audio-played', this);
  },

  _onAudioEnded() {
    this.stop(); // For IE11, who never learned to communicate a pause event
                 // after finishing playback
    this.trigger('audio-ended', this);
  },

  _onAudioError(e) {
    let error = "";
    switch (e.target.error.code) {
      case e.target.error.MEDIA_ERR_ABORTED:
        error = 'You aborted the audio playback.';
        break;
      case e.target.error.MEDIA_ERR_NETWORK:
        error = 'A network error caused the audio download to fail.';
        break;
      case e.target.error.MEDIA_ERR_DECODE:
        error = 'Decoder error.';
        break;
      case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        error = 'Audio source format is not supported.';
        break;
      default:
        error = 'unknown error.';
        break;
    }

    this.trigger('audio-load-error', error);
  },

  _onAudioPaused() {
    this.trigger('audio-paused', this);
  },

  _onAudioReady() {
    this.trigger('audio-ready', this);
  },

  _calculatePercentLoaded() {
    let audio = this.get('audio');

    if (audio && audio.ranges && audio.ranges.length) {
      let ranges = audio.buffered;
      let totals = [];
      for( var index = 0; index < ranges.length; index++ ) {
        totals.push(ranges.end(index) - ranges.start(index));
      }

      let total = Ember.A(totals).reduce((a, b) => (a + b), 0);

      this.debug(`ms loaded: ${total * 1000}`);
      this.debug(`duration: ${this._audioDuration()}`);
      this.debug(`percent loaded = ${(total / audio.duration) * 100}`);

      return (total / audio.duration);
    }
    else {
      return 0;
    }
  },


  /* Public interface */

  _audioDuration() {
    return this.get('audio').duration * 1000;
  },

  _currentPosition() {
    return this.get('audio').currentTime * 1000;
  },

  _setPosition(position) {
    this.get('audio').currentTime = (position / 1000);
  },

  _setVolume(volume) {
    this.get('audio').volume = (volume/100);
  },

  play() {
    let audio = this.get('audio');
    this.loadAudio();
    audio.play();
  },

  pause() {
    if (this.get('isStream')) {
      this.stop(); // we don't want to the stream to continue loading while paused
    }
    else {
      this.get('audio').pause();
    }
  },

  stop() {
    let audio = this.get('audio');
    audio.pause();

    Ember.run.next(() => {
      this.preventAudioFromLoading();
    });
  },

  loadAudio() {
    let audio = this.get('audio');
    if (audio.src !== this.get('url')) {
      audio.setAttribute('src', this.get('url'));
    }
  },

  preventAudioFromLoading() {
    let audio = this.get('audio');
    if (audio.src === this.get('url')) {
      this.debug('setting src to empty blob to stop loading');
      // Removing src attribute doesn't stop loading
      // Setting src to empty string stops loading, but throws audio error

      // Setting it to an empty blob does what we want

      audio.src = URL.createObjectURL(new Blob([], {type:"audio/mp3"}));
    }
  },

  willDestroy() {
    this._unregisterEvents();
    this.set('audio', undefined);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
