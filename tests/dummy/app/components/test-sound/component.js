import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';

export default Component.extend({
  layout,

  hifi: inject(),
  classNames: ['sound', 'test-sound'],

  isLoaded: computed('sound', 'sound.isLoading', function() {
    return (this.sound && !this.sound.isLoading)
  }),

  title: reads('item.title'),

  isPlaying: reads('sound.isPlaying'),

  url: reads('item.url'),

  isStream: reads('item.expectedValues.isStream'),
  duration: reads('item.expectedValues.duration'),

  playSound: task(function *() {
    yield this.hifi.play(this.url, {
      metadata: {
        title: this.title,
        expectedValues: this.item.expectedValues
      }
    });
  }),

  loadSound: task(function *() {
    yield this.hifi.load(this.url, {
      metadata: {
        title: this.title,
        expectedValues: this.item.expectedValues
      }
    });
  }),

});
