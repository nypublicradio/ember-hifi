import Ember from 'ember';
import BaseSound from './base';

// These are the events we're watching for
const AUDIO_EVENTS = ['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'progress', 'canplay', 'canplaythrough', 'error', 'playing', 'pause', 'ended', 'emptied'];

// Ready state values
// const HAVE_NOTHING = 0;
// const HAVE_METADATA = 1;
const HAVE_CURRENT_DATA = 2;
// const HAVE_FUTURE_DATA = 3;
// const HAVE_ENOUGH_DATA = 4;

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
    let sharedAudioElement = this.get('sharedAudioElement');
    sharedAudioElement.requestControl(this);

    let audio = this.audioElement();

    audio.src = this.get('url');
    this._registerEvents(audio);
    audio.load();
  },

  _registerEvents(audio) {
    AUDIO_EVENTS.forEach(eventName => {
      Ember.$(audio).on(eventName, e => this._handleAudioEvent(eventName, e));
    });
  },

  _unregisterEvents(audio) {
    AUDIO_EVENTS.forEach(eventName => Ember.$(audio).off(eventName));
  },

  _handleAudioEvent(eventName, e) {
    this.debug(`Handling '${eventName}' event from audio element`);

    if (!this.get('sharedAudioElement').hasControl(this)) {
      this.debug(`${this.get('url')} does not have access to the audio element`);
      return;
    }

    let audio = this.get('sharedAudioElement.audioElement');

    switch(eventName) {
      case 'loadeddata':
        // Firefox doesn't fire a 'canplay' event until after you call *play* on
        // the audio, but it does fire 'loadeddata' when it's ready
        if (audio.readyState >= HAVE_CURRENT_DATA) {
          this._onAudioReady();
        }
        break;
      case 'canplay':
      case 'canplaythrough':
        this._onAudioReady();
        break;
      case 'error':
        this._onAudioError(e);
        break;
      case 'playing':
        this._onAudioPlayed();
        break;
      // the emptied event is triggered by our more reliable stream pause method
      case 'emptied':
        this._onAudioEmptied();
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

  audioElement() {
    // If we have control, return the shared element
    // if we don't have control, return the dummy cloned element
    let sharedAudioElement  = this.get('sharedAudioElement');

    if (sharedAudioElement.hasControl(this)) {
      return sharedAudioElement.get('audioElement');
    }
    else {
      let dummyElement = (this.get('dummyElement') || document.createElement('audio'));
      this.set('dummyElement', dummyElement);

      return dummyElement;
    }
  },

  releaseControl() {
    this.get('sharedAudioElement').releaseControl(this);

    // save current state of audio element in this dummy element that won't be played
    this.set('dummyElement', this.get('sharedAudioElement.audioElement').cloneNode());
  },

  requestControl() {
    this.get('sharedAudioElement').requestControl(this);

    let element      = this.get('audioElement');
    let dummyElement = this.get('dummyElement');

    if (dummyElement) {
      // restore the state of the shared element to the dummy element
      element.currentTime = dummyElement.currentTime;
      element.volume      = dummyElement.volume;
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
    this.pause(); // For IE11, who never learned to communicate a pause event
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

    this.debug(`audio element threw error ${error}`);
    this.trigger('audio-load-error', error);
  },

  _onAudioEmptied() {
    if (this.get('isStream')) {
      this.trigger('audio-paused', this);
    }
  },

  _onAudioPaused() {
    this.trigger('audio-paused', this);
    this.releaseControl();
  },

  _onAudioReady() {
    this.trigger('audio-ready', this);
  },

  _calculatePercentLoaded() {
    let audio = this.audioElement();

    if (audio && audio.buffered && audio.buffered.length) {
      let ranges = audio.buffered;
      let totals = [];
      for( var index = 0; index < ranges.length; index++ ) {
        totals.push(ranges.end(index) - ranges.start(index));
      }

      let total = Ember.A(totals).reduce((a, b) => (a + b), 0);

      this.debug(`ms loaded: ${total * 1000}`);
      this.debug(`duration: ${this._audioDuration()}`);
      this.debug(`percent loaded = ${(total / audio.duration) * 100}`);

      return {percentLoaded: (total / audio.duration)};
    }
    else {
      return 0;
    }
  },

  /* Public interface */

  _audioDuration() {
    let audio = this.audioElement();
    return audio.duration * 1000;
  },

  _currentPosition() {
    let audio = this.audioElement();
    return audio.currentTime * 1000;
  },

  _setPosition(position) {
    let audio = this.audioElement();
    audio.currentTime = (position / 1000);
    return this._currentPosition();
  },

  _setVolume(volume) {
    let audio = this.audioElement();
    audio.volume = (volume/100);
  },

  play({position} = {}) {
    this.requestControl();
    let audio = this.audioElement();

    // since we clear the `src` attr on pause, restore it here
    this.loadAudio(audio);

    if (typeof position !== 'undefined') {
      this._setPosition(position);
    }
    audio.play();
  },

  pause() {
    let audio = this.audioElement();

    if (this.get('isStream')) {
      this.stop(); // we don't want to the stream to continue loading while paused
    }
    else {
      audio.pause();
    }

    this.releaseControl();
  },

  stop() {
    let audio = this.audioElement();
    audio.pause();

    // calling pause halts playback but does not stop downloading streaming
    // media. this is the method recommended by MDN: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video#Stopping_the_download_of_media
    // NOTE: this fires an `'emptied'` event, which we treat the same way as `'pause'`
    audio.removeAttribute('src');
    audio.load();
  },

  loadAudio(audio) {
    if (audio.src !== this.get('url')) {
      this.set('isLoading', true);
      audio.setAttribute('src', this.get('url'));
    }
  },

  willDestroy() {
    this.requestControl();
    let audio = this.audioElement();
    this._unregisterEvents(audio);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
