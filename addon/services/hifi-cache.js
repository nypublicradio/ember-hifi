import Service from '@ember/service';
import { A as emberArray, makeArray } from '@ember/array';
import DebugLogging from '../mixins/debug-logging';

export default Service.extend(DebugLogging, {
  debugName: 'hifi-cache',

  init() {
    this._super(...arguments);
    this.set('_cache', new Map());
  },

  reset() {
    this.set('_cache', new Map());
  },

  find(urls) {
    urls = makeArray(urls);
    let cache = this.get('_cache');
    let keysToSearch = emberArray(urls).map(url => (url.url || url));
    let sounds       = emberArray(keysToSearch).map(url => cache.get(url));
    let foundSounds  = emberArray(sounds).compact();

    if (foundSounds.length > 0) {
      this.debug(`cache hit for ${foundSounds[0].get('url')}`);
    }
    else {
      this.debug(`cache miss for ${keysToSearch.join(',')}`);
    }

    return foundSounds[0];
  },

  cache(sound) {
    let cache = this.get("_cache");
    this.debug(`caching sound with url: ${sound.get('url')}`);
    cache.set(sound.get('url'), sound);
  }
});
