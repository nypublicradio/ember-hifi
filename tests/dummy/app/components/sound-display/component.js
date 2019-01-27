import Component from '@ember/component';
import layout from './template';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  layout,
  hifi: inject(),
  hifiCache: inject(),
  classNames: ['sound', 'sound-display', 'is-loaded'],
  classNameBindings: ['isCurrentSound', 'isPlaying'],
  attributeBindings:['connectionName:data-connection-name'],
  isLoaded: computed('sound', 'sound.isLoading', function() {
    return (this.sound && !this.sound.isLoading)
  }),

  isPlaying: computed.reads('sound.isPlaying'),
  isStream: computed.reads('sound.isStream'),
  title: computed.reads('sound.metadata.title'),
  url: computed.reads('sound.url'),
  duration: computed.reads('sound.duration'),
  position: computed.reads('sound.position'),
  connectionName: computed.reads('sound.connectionName'),
  durationIsInfinity: computed.equal('duration', Infinity),

  isCurrentSound: computed('hifi.currentSound', function() {
    return (this.hifi.currentSound && this.hifi.currentSound.url === this.sound.url);
  }),

  onRemoval: function() {},

  didReceiveAttrs() {
    if (this.sound) { // we were passed an already loaded sound
      this.set('url', this.sound.url);
      this.set('sound', this.sound);
    }
  },

  playSound: task(function *(url) {
    let { sound } = yield this.hifi.play(this.url);
    this.set('sound', sound);
  }),

  loadSound: task(function *(url) {
    let { sound } = yield this.hifi.load(this.url);
    this.set('sound', sound);
  }),

  actions: {
    async removeSound() {
      this.onRemoval();
      this.sound.stop();
      this.hifiCache.remove(this.sound);
    },

    async fastForward() {
      this.sound.fastForward(3000);
    },

    async rewind() {
      this.sound.rewind(3000);
    },

    async play() {
      this.sound.play();
    },

    async pause() {
      this.sound.pause();
    },

    togglePause() {
      this.sound.togglePause();
    }
  }

});
