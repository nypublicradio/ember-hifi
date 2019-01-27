import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import move, { continuePrior } from 'ember-animated/motions/move';
import opacity from 'ember-animated/motions/opacity';
import {easeOut, easeIn } from 'ember-animated/easings/cosine';
import { parallel } from 'ember-animated';
import scale from 'ember-animated/motions/scale';
import { A } from '@ember/array';
import { task } from 'ember-concurrency';
export default Component.extend({
  layout,

  hifi: service(),
  hifiCache: service(),
  classNames: ['diagnostic-controls'],
  init() {
    this.set('testSounds', this.testSounds);
    this._super(...arguments);
  },

  dormantItems: computed('testSounds', 'hifiCache.cachedCount', function() {
    return this.testSounds.filter(item => !this.hifiCache.find(item.url))
  }),

  loadAllTestSounds: task(function *(url) {
    yield this.get('testSounds').forEach(item => {
      this.hifi.load(item.url);
    })
  }).drop(),

  playAllTestSounds: task(function *(url) {
    yield this.get('testSounds').forEach(item => {
      this.hifi.play(item.url);
    })
  }).drop(),

  playCustomSound: task(function *(url) {
    yield this.hifi.play(this.url, {
      metadata: {
        title: this.title
      }
    });
  }).drop(),

  loadCustomSound: task(function *(url) {
    yield this.hifi.load(this.url, {
      metadata: {
        title: this.title
      }
    });
  }).drop(),

  transition: function * (context) {
     let { keptSprites, sentSprites, receivedSprites } = context;

     keptSprites.forEach(sprite => {
       parallel(move(sprite), scale(sprite));
     });

     sentSprites.forEach(sprite => {
       parallel(move(sprite), scale(sprite));
     });

     receivedSprites.forEach(sprite => {
       sprite.moveToFinalPosition();
     });
   }
});
