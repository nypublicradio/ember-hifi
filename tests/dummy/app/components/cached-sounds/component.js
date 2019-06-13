import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import move from 'ember-animated/motions/move';
import {easeOut, easeIn } from 'ember-animated/easings/cosine';
import { parallel } from 'ember-animated';
import scale from 'ember-animated/motions/scale';
export default Component.extend({
  layout,

  hifi: service(),
  hifiCache: service(),

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

  loadedItems: computed('hifiCache.cachedCount', function() {
    return this.hifiCache._cacheArray; // animated each gets messed up unless you do this thing
  }),

  //eslint-disable-next-line
  transition: function * (context) {
     let { keptSprites, removedSprites, insertedSprites, beacons } = context;
     keptSprites.forEach(sprite => {
       parallel(move(sprite), scale(sprite));
     });

     removedSprites.forEach(sprite => {
       sprite.applyStyles({ 'z-index': 1});
       // It'd be great to rotate this thing -30degrees as it drops. But how
       sprite.endAtPixel({ y: 4000 });
       parallel(move(sprite, { easing: easeOut, duration: 1200}));
     }),

     insertedSprites.forEach(sprite => {
       let connectionName = sprite.element.getAttribute('data-connection-name')
       sprite.startAtSprite(beacons[connectionName]);
       parallel(move(sprite, { easing: easeIn, duration: 500}));
     });
   },

   actions: {
     fetchSound(url) {
       return this.hifiCache.find(url);
     }
   }
});
