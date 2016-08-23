import Ember from 'ember';
import BaseSound from './base';

let ClassMethods = Ember.Mixin.create({
  setup() {
  },

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
    Ember.$(audio).on('playing',         () => this.trigger('audio-played', sound));
    Ember.$(audio).on('pause',           () => this.trigger('audio-paused', sound));
    Ember.$(audio).on('error',           () => this.trigger('audio-load-error', sound));
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
