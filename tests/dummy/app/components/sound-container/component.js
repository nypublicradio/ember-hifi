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

  init() {
    this.set('testSounds', this.testSounds);
    this._super(...arguments);
  },
  loadedSoundCountSentence: computed('hifiCache.cachedCount', function() {
    let count = this.hifiCache.cachedCount
    if (count === 1) {
      return "1 Loaded Sound";
    }
    else if (count > 1) {
      return `${count} Loaded Sounds`;
    }
    else {
      return `Loaded Sounds`
    }
  }),

  loadedItems: computed('testSounds', 'hifiCache.cachedCount', function() {
    return this.testSounds.filter(item => this.hifiCache.find(item.url))
  }),

  dormantItems: computed('testSounds', 'hifiCache.cachedCount', function() {
    return this.testSounds.filter(item => !this.hifiCache.find(item.url))
  }),

  loadAllTestSounds: task(function *(url) {
    yield this.get('testSounds').forEach(item => {
      this.hifi.load(item.url);
    })
  }),

  playAllTestSounds: task(function *(url) {
    yield this.get('testSounds').forEach(item => {
      this.hifi.play(item.url);
    })
  }),

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
   },

   actions: {
     fetchSound(url) {
       return this.hifiCache.find(url);
     }
   }
});
