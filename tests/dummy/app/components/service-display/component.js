import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
export default Component.extend({
  layout,
  hifi: service(),
  hifiCache: service(),
  classNames: ['service-display'],
  cachedCount: computed.reads('hifiCache.cachedCount'),

  connections: computed("hifi._connections", function() {
    return Object.values(this.hifi._connections);
  }),

  currentSound: computed.reads('hifi.currentSound'),

  actions: {
    togglePause() {
      this.hifi.togglePause()
    },
    stop(urls) {
      this.hifi.stop()
    },
    fastForward(time) {
      this.hifi.fastForward(time)
    },
    rewind(time) {
      this.hifi.rewind(time)
    }
  }

});
