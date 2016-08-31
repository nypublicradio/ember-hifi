import Ember from 'ember';
const {
  A: emberArray
} = Ember;
export default Ember.Object.extend(Ember.Evented, {
  _cache: new Ember.Map(),

  reset() {
    this.set('_cache', new Ember.Map());
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
