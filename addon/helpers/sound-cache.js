import Ember from 'ember';
import get from 'ember-metal/get';

export default Ember.Object.extend(Ember.Evented, {
  _cache: new Ember.Map(),

  find(urls) {
    let cache = this.get('_cache');
    let sounds = urls.map(url => cache.get(url)).compact();
    return sounds[0];
  },

  cache(soundObject) {
    let cache = this.get("_cache");
    cache.set(get(soundObject, 'url'), soundObject);
  }
});
