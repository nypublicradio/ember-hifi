import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import move from 'ember-animated/motions/move';
import { parallel } from 'ember-animated';
import scale from 'ember-animated/motions/scale';
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
    return this.testSounds.filter(item => !this.hifiCache._cache[item.url])
  }),

  loadAllTestSounds: task(function *() {
    yield this.get('testSounds').forEach(item => {
      this.hifi.load(item.url, {
        metadata: {
          title: item.title
        }
      });
    })
  }).drop(),

  playAllTestSounds: task(function *() {
    yield this.get('testSounds').forEach(item => {
      this.hifi.play(item.url, {
        metadata: {
          title: item.title,
          debug: {

          }
        }
      });
    })
  }).drop(),

  playCustomSound: task(function *() {
    yield this.hifi.play(this.url, {
      metadata: {
        title: this.title,
        debug: {

        }
      }
    });
  }).drop(),

  loadCustomSound: task(function *() {
    try {
      yield this.hifi.load(this.url, {
        metadata: {
          title: this.title
        }
      });
    }
    catch(e) {
      this.set('error', e);
    }
  }).drop(),

  //eslint-disable-next-line
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
