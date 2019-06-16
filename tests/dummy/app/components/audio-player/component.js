import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['audio-player'],
  audioService: null,
  currentItem: computed.readOnly('audioService.currentSound'),
  isPlaying:  computed.readOnly('audioService.isPlaying'),
  isLoading:  computed.readOnly('audioService.isLoading'),

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
