import Ember from 'ember';

export default Ember.Object.extend(Ember.Evented, {
  _cache: new Ember.Map(),

  find(urls) {
    let cache = this.get('_cache');
    let sounds = urls.map(url => cache.get(url)).compact();
    return sounds[0];
  },

  cache(sound) {
    let cache = this.get("_cache");
    cache.set(sound.get('url'), sound);
  }
});
