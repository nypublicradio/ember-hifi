import Component from '@ember/component';
import layout from './template';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  layout,

  hifi: inject(),
  classNames: ['sound test-sound'],

  isLoaded: computed('sound', 'sound.isLoading', function() {
    return (this.sound && !this.sound.isLoading)
  }),

  title: computed.reads('item.title'),

  isPlaying: computed.reads('sound.isPlaying'),

  url: computed.reads('item.url'),

  isStream: computed.reads('item.expectedValues.isStream'),
  duration: computed.reads('item.expectedValues.duration'),

  playSound: task(function *(url) {
    let { sound } = yield this.hifi.play(this.url, {
      metadata: {
        title: this.title,
        expectedValues: this.item.expectedValues
      }
    });
  }),

  loadSound: task(function *(url) {
    let { sound } = yield this.hifi.load(this.url, {
      metadata: {
        title: this.title,
        expectedValues: this.item.expectedValues
      }
    });
  }),

});
