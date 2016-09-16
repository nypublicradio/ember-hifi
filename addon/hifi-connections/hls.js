import Ember from 'ember';
import BaseSound from './base';
import HLS from 'hls';

let ClassMethods = Ember.Mixin.create({
  extensionWhiteList: ['m3u8'],

  canUseConnection(/* audioUrl */) {
    // We basically never want to use this on a mobile device
    return HLS.isSupported();
  },

  toString() {
    return 'HLS.js';
  }
});

let Sound = BaseSound.extend({
  loaded: false,
  mediaRecoveryAttempts: 0,

  setup() {
    let hls   = new HLS({debug: false, startFragPrefetch: true});
    let video = document.createElement('video');

    this.set('video', video);
    this.set('hls', hls);
    hls.attachMedia(video);
    this._setupHLSEvents(hls);
    this._setupPlayerEvents(video);
  },

  _setupHLSEvents(hls) {
    hls.on(HLS.Events.MEDIA_ATTACHED, () => {
      this.debug('media attached');
      hls.loadSource(this.get('url'));

      hls.on(HLS.Events.MANIFEST_PARSED, (e, data) => {
        this.debug(`manifest parsed and loaded, found ${data.levels.length} quality level(s)`);
        this.set('manifest', data);
      });

      hls.on(HLS.Events.LEVEL_LOADED, (e, data) => {
        this.debug(`level ${data.level} loaded`);
        this._checkIfAudioIsReady();
      });

      hls.on(HLS.Events.AUDIO_TRACK_LOADED, () => {
        this.debug('audio track loaded');
        this._checkIfAudioIsReady();
      });

      hls.on(HLS.Events.ERROR, (e, data) => this._onHLSError(e, data));
    });
  },

  _setupPlayerEvents(video) {
    Ember.$(video).on('playing',         () => {
      if (this.get('loaded')) {
        this.trigger('audio-played', this);
      }
      else {
        this._signalAudioIsReady();
      }
    });

    Ember.$(video).on('pause',           ()  => this.trigger('audio-paused', this));
    Ember.$(video).on('durationchange',  ()  => this.trigger('audio-duration-changed', this));
    Ember.$(video).on('seeked',          ()  => this.trigger('audio-position-changed', this));
    Ember.$(video).on('progress',        ()  => this.trigger('audio-loading'));
    Ember.$(video).on('error',           (e) => this._onVideoError(e));
  },

  _checkIfAudioIsReady() {
    if (!this.get('loaded')) {
      // The only reliable way to check if this thing is actually ready
      // is to play it. If we get a play signal we're golden, but if we
      // get an error, we're outta here

      this.debug('Testing if audio is ready');
      this.get('video').volume = 0;
      this.get('video').play();
    }
  },

  _signalAudioIsReady() {
    this.debug('Test succeeded, signaling audio-ready');
    this.set('loaded', true);
    this.get('video').pause();
    this.trigger('audio-ready');
  },

  _onVideoError(e) {
    switch (e.target.error.code) {
      case e.target.error.MEDIA_ERR_ABORTED:
        this.debug("video element error: playback aborted");
        this._giveUpAndDie("unknown error");
        break;
      case e.target.error.MEDIA_ERR_NETWORK:
        this.debug("video element error: network error");
        this._giveUpAndDie("Network error caused download to fail");
        break;
      case e.target.error.MEDIA_ERR_DECODE:
        this.debug("video element error: decoding error");
        this._tryToRecoverFromMediaError(e.target.error.MEDIA_ERR_DECODE);
        break;
      case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        this.debug("video element error: source format not supported");
        this._giveUpAndDie("audio source format is not supported");
        break;
      default:
        this._giveUpAndDie("unknown error");
        break;
    }
  },

  _onHLSError(error, data) {
    if (data.fatal) {
      switch(data.type) {
        case HLS.ErrorTypes.NETWORK_ERROR:
          this.debug(data);
          this._giveUpAndDie(`${data.details}`);
          break;
        case HLS.ErrorTypes.MEDIA_ERROR:
          this._tryToRecoverFromMediaError(`${data.details}`);
          break;
        default:
          this._giveUpAndDie(`${data.details}`);
          break;
      }
    }
  },

  _tryToRecoverFromMediaError(error) {
    let mediaRecoveryAttempts = this.get('mediaRecoveryAttempts');
    let hls = this.get('hls');

    switch(mediaRecoveryAttempts) {
      case 0:
        this.debug(`First attempt at media error recovery for error: ${error}`);
        hls.recoverMediaError();
        break;
      case 1:
        this.debug(`Second attempt at media error recovery: switching codecs for error: ${error}`);
        hls.swapAudioCodec();
        hls.recoverMediaError();
        break;
      case 2:
        this.debug(`We tried our best and we failed: ${error}`);
        this._giveUpAndDie(error);
        break;
    }

    this.incrementProperty('mediaRecoveryAttempts');
  },

  _giveUpAndDie(error) {
    this.get('hls').destroy();
    this.trigger('audio-load-error', error);
  },


  /* Public interface to sound */

  _audioDuration() {
    return Infinity; // only streams
  },

  currentPosition() {
    return this.get('video').currentTime;
  },

  setPosition(position) {
    this.get('video').currentTime = position;
  },

  _setVolume(volume) {
    this.get('video').volume = (volume/100);
  },

  play() {
    this.get('video').play();

    if (this.get('loadStopped')) {
      this.get('hls').startLoad();
      this.set('loadStopped', false);
    }
  },

  pause() {
    this.stop(); // We always want to stop the stream so it doesn't continue to download
  },

  stop() {
    this.get('video').pause();
    this.get('hls').stopLoad();
    this.set('loadStopped', true);
  },

  teardown() {
    this.get('hls').destroy();
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
