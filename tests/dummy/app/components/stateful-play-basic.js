import Component from 'ember-component';
import service from 'ember-service/inject';
import layout from '../templates/components/play-basic';
import computed from 'ember-computed';

export default Component.extend({
  layout,
  // BEGIN-SNIPPET play-stateful
  hifi: service(),
  
  isCurrentSound: computed('hifi.currentId', function() {
    return this.get('hifi.currentId') === this.get('stream.url');
  }),
  
  isPlaying: computed('isCurrentSound', 'hifi.isPlaying', function() {
    return this.get('isCurrentSound') && this.get('hifi.isPlaying');
  }),
  
  isLoading: computed('isCurrentSound', 'hifi.isLoading', function() {
    return this.get('isCurrentSound') && this.get('hifi.isLoading');
  }),
  
  actions: {
    play(url) {
      this.get('hifi').play(url);
    },
    pause() {
      this.get('hifi').pause();
    }
  }
  // END-SNIPPET
});
