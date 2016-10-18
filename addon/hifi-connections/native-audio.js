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
    let audio = this.get('audioElement');
    if (!audio) {
      audio = document.createElement('audio');
    }

    this.set('audio', audio);
    audio.src = this.get('url');
    this._registerEvents();
    audio.load();
  },

  _registerEvents() {
    let audio = this.get('audio');
    AUDIO_EVENTS.forEach(eventName => {
      Ember.$(audio).on(eventName, e => this._handleAudioEvent(eventName, e));
    });
  },

  _unregisterEvents() {
    let audio = this.get('audio');
    AUDIO_EVENTS.forEach(eventName => {
      Ember.$(audio).off(eventName, e => this._handleAudioEvent(eventName, e));
    });
  },

  _handleAudioEvent(eventName, e) {
    this.debug(`Handling '${eventName}' event from audio element`);
    let audio = this.get('audio');
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

    this.debug(`audio element threw error ${error}`);
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
    
    // calling pause halts playback but does not stop downloading streaming
    // media. this is the method recommended by MDN: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video#Stopping_the_download_of_media
    // NOTE: this fires an `'emptied'` event, which we treat the same way as `'pause'`
    audio.removeAttribute('src');
    audio.load();
  },

  loadAudio() {
    let audio = this.get('audio');
    if (audio.src !== this.get('url')) {
      this.set('isLoading', true);
      audio.setAttribute('src', this.get('url'));
    }
  },
  
  willDestroy() {
    this._unregisterEvents();
    this.set('audio', undefined);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
