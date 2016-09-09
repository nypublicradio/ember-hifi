import Ember from 'ember';
import BaseSound from './base';

let ClassMethods = Ember.Mixin.create({
  canPlayExtension(extension) {
    let audio = new Audio();

    if (Ember.A(['m3u8', 'm3u']).contains(extension)) {
      return audio.canPlayType(`audio/mpeg`) !== "";
    }
    else {
      // it returns "probably" and "maybe". Both are worth trying. Empty is bad.
      return (audio.canPlayType(`audio/${extension}`) !== "");
    }
  },

  toString() {
    return 'Native Audio';
  }
});

let Sound = BaseSound.extend({
  init() {
    this._super(...arguments);
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

    Ember.$(audio).on('canplay',         ()  => this._relayEvent('canplay'));
    Ember.$(audio).on('error',           (e) => this._relayEvent('error', e));
    Ember.$(audio).on('playing',         ()  => this._relayEvent('playing'));
    Ember.$(audio).on('pause',           ()  => this._relayEvent('pause'));
    Ember.$(audio).on('durationchange',  ()  => this._relayEvent('durationchange'));
  },

  _unregisterEvents() {
    let audio = this.get('audio');

    Ember.$(audio).off('canplay',         ()  => this._relayEvent('canplay'));
    Ember.$(audio).off('error',           (e) => this._relayEvent('error', e));
    Ember.$(audio).off('playing',         ()  => this._relayEvent('playing'));
    Ember.$(audio).off('pause',           ()  => this._relayEvent('pause'));
    Ember.$(audio).off('durationchange',  ()  => this._relayEvent('durationchange'));
  },

  _relayEvent(eventName) {
    // if (this.constructor.currentUrl !== this.get('url')) {
    //   this.debug(`✋🏻 ignored ${eventName} for ${this.get('url')}`);
    //   return;
    // }
    // else {
    //   this.debug(`✅ passed through ${eventName} for ${this.get('url')} ✅`);
    // }

    switch(eventName) {
      case 'canplay':
        this._onAudioReady();
        break;
      case 'error':
        this._onAudioError(arguments[1]);
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
    }
  },

  _onAudioDurationChanged() {
    let audio = this.get('audio');
    this.set('duration', (audio.duration * 1000));
  },

  _onAudioPlayed() {
    this.trigger('audio-played', this);
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

  audioDuration() {
    return this.duration;
  },

  currentPosition() {
    return this.get('audio').currentTime * 1000;
  },

  setPosition(position) {
    this.get('audio').currentTime = (position / 1000);
  },

  _setVolume(volume) {
    this.get('audio').volume = (volume/100);
  },

  play() {
    this.get('audio').play();
  },

  pause() {
    this.get('audio').pause();
  },

  stop() {
    this.get('audio').pause();
  },

  willDestroy() {
    this._unregisterEvents();
    this.set('audio', undefined);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
