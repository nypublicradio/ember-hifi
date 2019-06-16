import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
export default Component.extend({
  layout,
  hifi: service(),
  hifiCache: service(),
  classNames: ['service-display'],
  classNameBindings: ['showDebugInfo'],
  cachedCount: reads('hifiCache.cachedCount'),

  connections: computed("hifi._connections", function() {
    return Object.values(this.hifi._connections);
  }),

  currentSound: reads('hifi.currentSound'),

  actions: {
    togglePause() {
      this.hifi.togglePause()
    },
    stop() {
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
