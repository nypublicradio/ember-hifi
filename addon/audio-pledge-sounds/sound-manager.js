import Ember from 'ember';
import BaseSound from './base';
const {
  computed
} = Ember;

export default BaseSound.extend({
  init() {
    this.on('audio-played',    () => this.set('isPlaying', true));
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-resumed',   () => this.set('isPlaying', true));
    this.on('audio-stopped',   () => this.set('isPlaying', false));
    this.on('audio-loaded',    () => {
      this.set('duration', this.get('soundManagerSound').duration);
      this.set('isLoading', false);
    });
    this.on('audio-loading',   () => this.set('isLoading', true));
  },

  play() {
    this.get('soundManagerSound').play();
  },

  pause() {
    this.get('soundManagerSound').pause();
  },

  stop() {
    this.get('soundManagerSound').stop();
  },

  forward(duration) {
    this.get('soundManagerSound').forward(duration);
  },

  rewind(duration) {
    this.get('soundManagerSound').rewind(duration);
  },

  setPosition(position) {
    this.get('soundManagerSound').setPosition(position);
  }
});
