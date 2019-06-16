import Component from '@ember/component';
import { inject as service } from '@ember/service';
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
