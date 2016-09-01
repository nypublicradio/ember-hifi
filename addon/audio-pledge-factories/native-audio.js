import Ember from 'ember';
import BaseSound from './base';

let ClassMethods = Ember.Mixin.create({
  canPlay(/* url */) {
    return true;
  },

  toString() {
    return 'Native Audio';
  }
});

let Sound = BaseSound.extend({
  init() {
    this._super(...arguments);

    let sound = this;
    let audio = new Audio(this.get('url'));

    Ember.$(audio).on('canplay',         () => this.trigger('audio-ready', sound));
    // Ember.$(audio).on('canplaythrough',  () => this.trigger('audio-ready', sound));

    Ember.$(audio).on('playing',         () => this.trigger('audio-played', sound));
    Ember.$(audio).on('pause',           () => this.trigger('audio-paused', sound));
    Ember.$(audio).on('error',           (e) => {
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
    });

    Ember.$(audio).on('durationchange',  () => this.set('duration', this.duration));
    this.set('audio', audio);
  },

  audioDuration() {
    return this.duration;
  },

  currentPosition() {
    return this.get('audio').currentTime;
  },

  setPosition(position) {
    this.get('audio').seek(position / 1000);
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
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
