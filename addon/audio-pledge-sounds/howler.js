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
      this.set('isLoading', false);
      this.set('duration', this.get('howl').duration());
      console.log(this.get('duration'));
    });
    this.on('audio-loading',   () => this.set('isLoading', true));
  },

  play() {
    this.get('howl').play();
  },

  pause() {
    this.get('howl').pause();
  },

  stop() {
    this.get('howl').stop();
  },

  forward(duration) {
    this.get('howl').forward(duration);
  },

  rewind(duration) {
    this.get('howl').rewind(duration);
  },

  setPosition(position) {
    this.get('howl').setPosition(position);
  }
});
