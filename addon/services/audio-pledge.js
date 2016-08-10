import Ember from 'ember';
import SoundCache from '../helpers/sound-cache';
import getOwner from 'ember-getowner-polyfill';
import RSVP from 'rsvp';
const {
  Service,
  computed,
  getWithDefault,
  assert,
  get,
  set,
  A: emberArray,
  String: { dasherize }
} = Ember;

export default Service.extend(Ember.Evented, {
  currentSound: null,

  isPlaying: computed.alias('currentSound.isPlaying'),
  isLoading: computed.alias('currentSound.isLoading'),

  init() {
    const adapters = getWithDefault(this, 'options.audioPledgeAdapters', emberArray());
    const owner = getOwner(this);
    owner.registerOptionsForType('audio-pledge@audio-pledge-adapter', { instantiate: false });
    owner.registerOptionsForType('audio-pledge-adapter', { instantiate: false });
    set(this, 'appEnvironment', getWithDefault(this, 'options.environment', 'development'));
    set(this, '_adapters', {});
    this.activateAdapters(adapters);

    set(this, 'soundCache', new SoundCache());

    this.set('isReady', true);
    this._super(...arguments);
  },

  play(urls) {
    if (!Ember.isArray(urls)) {
      urls = [urls];
    }

    let promise = new RSVP.Promise((resolve, reject) => {
      let sound = this.get('soundCache').find(urls);
      if (sound) {
        resolve(sound);
      }
      else {
        let adapter       = this.selectAdapter(urls);
        let createPromise = adapter.createSound(urls)
          .then(sound => resolve(sound))
          .catch(reject);

        return createPromise;
      }
    });
    promise.then(sound => {
      if (this.get('currentSound')) {
        this.pause();
      }
      this.get('soundCache').cache(sound);

      this._unregisterEvents(this.get('currentSound'));
      this._registerEvents(sound);
      this.set('currentSound', sound);

      sound.play();
    });
    return promise;
  },

  pause() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
    this.get('currentSound').pause();
  },

  togglePause() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));

    if (this.get('isPlaying')) {
      this.get('currentSound').pause();
    }
    else {
      this.get('currentSound').play();
    }
  },

  forward() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
  },

  rewind() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
  },

  _registerEvents(sound) {
    sound.on('audio-played',  () => this.relayEvent('audio-played', sound));
    sound.on('audio-paused',  () => this.relayEvent('audio-paused', sound));
    sound.on('audio-resumed', () => this.relayEvent('audio-resumed', sound));
    sound.on('audio-stopped', () => this.relayEvent('audio-stopped', sound));
    sound.on('audio-loaded',  () => this.relayEvent('audio-loaded', sound));
    sound.on('audio-loading', () => this.relayEvent('audio-loading', sound));
  },

  _unregisterEvents(sound) {
    if (!sound) {
      return;
    }

    sound.off('audio-played',  () => this.relayEvent('audio-played', sound));
    sound.off('audio-paused',  () => this.relayEvent('audio-paused', sound));
    sound.off('audio-resumed', () => this.relayEvent('audio-resumed', sound));
    sound.off('audio-stopped', () => this.relayEvent('audio-stopped', sound));
    sound.off('audio-loaded',  () => this.relayEvent('audio-loaded', sound));
    sound.off('audio-loading', () => this.relayEvent('audio-loading', sound));
  },

  relayEvent(eventName, sound) {
    console.log(`${eventName} -> ${sound.get('url')}`);
    this.trigger(eventName, sound);
  },

  selectAdapter(/* urls */) {
    // Select a random adapter for testing

    let adapters = this.get('_adapters');
    let options = Object.keys(adapters);
    let choice = options[Math.floor(Math.random() * options.length)];

    console.log(`Choosing ${choice} adapter`);
    return this.get(`_adapters.${choice}`);
  },

  activateAdapters(adapterOptions = []) {
   const cachedAdapters = get(this, '_adapters');
   const activatedAdapters = {};

   adapterOptions
     .forEach((adapterOption) => {
       const { name } = adapterOption;
       const adapter = cachedAdapters[name] ? cachedAdapters[name] : this._activateAdapter(adapterOption);

       set(activatedAdapters, name, adapter);
     });

   return set(this, '_adapters', activatedAdapters);
  },

  _activateAdapter({ name, config } = {}) {
    const Adapter = this._lookupAdapter(name);
    assert('[audio-pledge] Could not find audio adapter ${name}.', name);
    console.log(Adapter);

    return Adapter.create({ this, config });
  },

  /**
   * Looks up the adapter from the container. Prioritizes the consuming app's
   * adapters over the addon's adapters.
   *
   * @method _lookupAdapter
   * @param {String} adapterName
   * @private
   * @return {Adapter} a local adapter or an adapter from the addon
   */

  _lookupAdapter(adapterName) {
    assert('[audio-pledge] Could not find audio adapter without a name.', adapterName);

    const dasherizedAdapterName = dasherize(adapterName);
    const availableAdapter = getOwner(this).lookup(`audio-pledge@audio-pledge-adapter:${dasherizedAdapterName}`);
    const localAdapter = getOwner(this).lookup(`audio-pledge-adapter:${dasherizedAdapterName}`);

    assert('[audio-pledge] Could not load audio adapter ${dasherizedAdapterName}', (localAdapter || availableAdapter));

    return localAdapter ? localAdapter : availableAdapter;
  }
});
