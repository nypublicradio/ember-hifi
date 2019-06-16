import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from '../templates/components/play-basic';
import { computed } from '@ember/object';
import { reads } from '@ember/object/computed';

export default Component.extend({
  layout,
  // BEGIN-SNIPPET play-stateful
  hifi: service(),

  currentSound:   reads('hifi.currentMetadata.id'),
  isCurrentSound: computed('currentSound', function() {
    return this.get('currentSound') === this.get('stream.url');
  }),

  isPlaying: computed('isCurrentSound', 'hifi.isPlaying', function() {
    return this.get('isCurrentSound') && this.get('hifi.isPlaying');
  }),

  isLoading: computed('isCurrentSound', 'hifi.isLoading', function() {
    return this.get('isCurrentSound') && this.get('hifi.isLoading');
  }),

  actions: {
    play(url) {
      this.get('hifi').play(url, {metadata: {id: url}});
    },
    pause() {
      this.get('hifi').pause();
    }
  }
  // END-SNIPPET
});
