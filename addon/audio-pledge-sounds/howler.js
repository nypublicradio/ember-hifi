import BaseSound from './base';

export default BaseSound.extend({
  _adapter: 'howler',

  init() {
    this.on('audio-played',    () => this.set('isPlaying', true));
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-resumed',   () => this.set('isPlaying', true));
    this.on('audio-stopped',   () => this.set('isPlaying', false));
    this.on('audio-loaded',    () => {
      this.set('isLoading', false);
    });
    this.on('audio-loading',   () => this.set('isLoading', true));
  },

  play() {
    this.get('_sound').play();
  },

  pause() {
    this.get('_sound').pause();
  },

  stop() {
    this.get('_sound').stop();
  },

  forward(duration) {
    this.get('_sound').forward(duration);
  },

  rewind(duration) {
    this.get('_sound').rewind(duration);
  },

  setPosition(position) {
    this.get('_sound').setPosition(position);
  }
});
