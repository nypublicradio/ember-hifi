import Ember from 'ember';
const {
  A: emberArray
} = Ember;

export default Ember.Service.extend({
  _cache: Ember.Map.create(),

  reset() {
    this.set('_cache', Ember.Map.create());
  },

  find(urls) {
    urls = Ember.makeArray(urls);
    let cache = this.get('_cache');
    let sounds = emberArray(urls).map(url => cache.get(url));
    return emberArray(sounds).compact()[0];
  },

  cache(sound) {
    let cache = this.get("_cache");
    cache.set(sound.get('url'), sound);
  }
});
