import Ember from 'ember';

export default Ember.Service.extend({

  init() {
    this.set('cache', new Ember.Map());
  },

  /**
  * Cache a sound file
  *
  * @method cache
  * @param {Sound} sound
  * @return {Void}
  */

  cache(sound) {

  },

  /**
  * Cache a sound file
  *
  * @method cache
  * @param {Array} urls
  * @return {Sound}
  */

  find(urls) {

  }
});
