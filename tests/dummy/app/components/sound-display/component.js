import { reads, equal } from '@ember/object/computed';
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

  isPlaying: reads('sound.isPlaying'),
  isStream: reads('sound.isStream'),
  isFastForwardable: reads('sound.isFastForwardable'),
  isRewindable: reads('sound.isRewindable'),
  title: reads('sound.metadata.title'),
  url: reads('sound.url'),
  duration: reads('sound.duration'),
  position: reads('sound.position'),
  connectionName: reads('sound.connectionName'),
  durationIsInfinity: equal('duration', Infinity),

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

  playSound: task(function *() {
    let { sound } = yield this.hifi.play(this.url);
    this.set('sound', sound);
  }),

  loadSound: task(function *() {
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

    async stop() {
      this.sound.stop();
    },

    async pause() {
      this.sound.pause();
    },

    togglePause() {
      this.sound.togglePause();
    }
  }

});
