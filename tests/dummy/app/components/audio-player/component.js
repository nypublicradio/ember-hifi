import { readOnly } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  classNames: ['audio-player'],
  audioService: null,
  currentItem: readOnly('audioService.currentSound'),
  isPlaying:  readOnly('audioService.isPlaying'),
  isLoading:  readOnly('audioService.isLoading'),

  actions: {
    toggle() {
      this.get('audioService').togglePause();
    },
    forward(delta) {
      this.get('audioService').forward(delta);
    },
    rewind(delta) {
      this.get('audioService').rewind(delta);
    }
  }
});
