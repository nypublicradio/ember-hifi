import { reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task, timeout } from 'ember-concurrency';
import { later } from '@ember/runloop';
import { getOwner } from '@ember/application';

export default Component.extend({
  layout,

  hifi: service(),
  router: service(),
  classNames: ['sound', 'test-sound'],

  isLoaded: computed('sound', 'sound.isLoading', function() {
    return (this.sound && !this.sound.isLoading)
  }),

  title: reads('item.title'),

  isPlaying: reads('sound.isPlaying'),

  url: reads('item.url'),

  isStream: reads('item.debug.expectedValues.isStream'),
  duration: reads('item.debug.expectedValues.duration'),

  playSound: task(function *() {
    return yield this.hifi.play(this.url, {
      metadata: {
        title: this.title,
        debug: {
          expectedValues: this.item.expectedValues
        }
      }
    });
  }),

  autoPlaySound() {
    window.location = `${this.router.urlFor('diagnostic')}?autoplay=${this.url}`
  },

  loadSound: task(function *() {
    return yield this.hifi.load(this.url, {
      metadata: {
        title: this.title,
        debug: {
          expectedValues: this.item.expectedValues
        }
      }
    });
  }),

});
