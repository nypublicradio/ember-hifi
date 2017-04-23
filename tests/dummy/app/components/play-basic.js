import Component from 'ember-component';
import service from 'ember-service/inject';
import layout from '../templates/components/play-basic';

export default Component.extend({
  layout,
  // BEGIN-SNIPPET play1
  hifi: service(),
  
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
