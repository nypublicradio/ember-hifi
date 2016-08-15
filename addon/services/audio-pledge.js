import Ember from 'ember';
import SoundCache from '../helpers/sound-cache';
import OneAtATime from '../helpers/one-at-a-time';
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
  currentSound:   null,
  isPlaying:      computed.readOnly('currentSound.isPlaying'),
  canFastForward: computed.readOnly('currentSound.canFastForward'),
  canRewind:      computed.readOnly('currentSound.canRewind'),
  isLoading:      computed('currentSound.isLoading', {
    get() {
      return this.get('currentSound.isLoading');
    },
    set(k, v) { return v; }
  }),

  /**
   * When the Service is created, activate factories that were specified in the
   * configuration. This config is injected into the Service as `options`.
   *
   * @method init
   * @param {Void}
   * @return {Void}
   */

  init() {
    const factories = getWithDefault(this, 'options.audioPledgeFactories', emberArray());
    const owner = getOwner(this);
    owner.registerOptionsForType('audio-pledge@audio-pledge-factory', { instantiate: false });
    owner.registerOptionsForType('audio-pledge-factory', { instantiate: false });

    set(this, 'appEnvironment', getWithDefault(this, 'options.environment', 'development'));
    set(this, '_factories', {});
    set(this, 'soundCache', new SoundCache());
    set(this, 'oneAtATime', new OneAtATime());

    this.activateFactories(factories);

    this.set('isReady', true);
    this._super(...arguments);
  },

  /**
   * Given an array of URLS, return a sound ready for playing
   *
   * @method load
   * @param {Array} urls
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error
   */

  load(urls) {
    if (!Ember.isArray(urls)) {
      urls = [urls];
    }

    urls = urls.compact().uniq();

    let promise = new RSVP.Promise((resolve, reject) => {
      let sound = this.get('soundCache').find(urls);
      if (sound) {
        resolve(sound);
      }
      else {
        let SoundFactory  = this.selectFactory(urls);
        this.set('isLoading', true);
        let sound = SoundFactory.create({urls: urls, service: this});

        sound.on('audio-ready', resolve);
        sound.on('audio-load-error', reject);
      }
    });
    promise.then(sound => this.get('soundCache').cache(sound));
    promise.then(sound => this.get('oneAtATime').register(sound));

    return promise;
  },

  /**
   * Given an array of URLS, return a sound and play it.
   *
   * @method load
   * @param {Array} urls
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error
   */

  play(urls) {
    let promise = this.load(urls);
    promise.then(sound => {
      if (this.get('currentSound')) {
        this.pause();
      }

      this._unregisterEvents(this.get('currentSound'));
      this._registerEvents(sound);
      this.set('currentSound', sound);

      sound.play();
    });
    return promise;
  },

  /**
   * Pauses the current sound
   *
   * @method pause
   * @param {Void}
   * @returns {Void}
   */

  pause() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
    this.get('currentSound').pause();
  },

  /**
   * Toggles play/pause state of the current sound
   *
   * @method pause
   * @param {Void}
   * @returns {Void}
   */

  togglePause() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));

    if (this.get('isPlaying')) {
      this.get('currentSound').pause();
    }
    else {
      this.get('currentSound').play();
    }
  },

  /**
   * Fast forwards current sound if able
   *
   * @method fastForward
   * @param {Integer} duration
   * @returns {Void}
   */

  fastForward(duration) {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));

    this.get('currentSound').fastforward(duration);
  },


  /**
   * Rewinds current sound if able
   *
   * @method rewind
   * @param {Integer} duration
   * @returns {Void}
   */

  rewind(duration) {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));

    this.get('currentSound').rewind(duration);
  },

  setPosition(position) {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));

    this.get('currentSound').setPosition(position);
  },

  /**
   * Register events on a current sound. Audio events triggered on that sound
   * will be relayed and triggered on this service
   *
   * @method _registerEvents
   * @param {Object} sound
   * @private
   * @return {Void}
   */

  _registerEvents(sound) {
    sound.on('audio-played',  () => this.relayEvent('audio-played', sound));
    sound.on('audio-paused',  () => this.relayEvent('audio-paused', sound));
    sound.on('audio-resumed', () => this.relayEvent('audio-resumed', sound));
    sound.on('audio-stopped', () => this.relayEvent('audio-stopped', sound));
    sound.on('audio-loaded',  () => this.relayEvent('audio-loaded', sound));
    sound.on('audio-loading', () => this.relayEvent('audio-loading', sound));
  },

  /**
   * Register events on a current sound. Audio events triggered on that sound
   * will be relayed and triggered on this service
   *
   * @method _unregisterEvents
   * @param {Object} sound
   * @private
   * @return {Void}
   */

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

  /**
   * Relays an audio event on the sound to an event on the service
   *
   * @method relayEvent
   * @param {String, Object} eventName, sound
   * @private
   * @return {Void}
   */

  relayEvent(eventName, sound) {
    console.log(`${eventName} -> ${sound.get('url')}`);
    this.trigger(eventName, sound);
  },

  /**
   * Selects a compatiable factory based on the URL
   *
   * @method selectFactory
   * @param {Array} urls
   * @return [Factory] activated factories
   */

  selectFactory(/* urls */) {
    // Select a random factory for testing

    let factories = this.get('_factories');
    let options = Object.keys(factories);
    let choice = options[Math.floor(Math.random() * options.length)];
    console.log(`Choosing ${choice} factory`);
    return this.get(`_factories.${choice}`);
  },

  /**
   * Activates the factories as specified in the config options
   *
   * @method activateFactories
   * @param {Array} factoryOptions
   * @return {Object} instantiated factories
   */

  activateFactories(factoryOptions = []) {
   const cachedFactories = get(this, '_factories');
   const activatedFactories = {};

   factoryOptions
     .forEach((factoryOption) => {
       const { name } = factoryOption;
       const factory = cachedFactories[name] ? cachedFactories[name] : this._activateFactory(factoryOption);

       set(activatedFactories, name, factory);
     });

   return set(this, '_factories', activatedFactories);
  },

  _activateFactory({ name, config } = {}) {
    const Factory = this._lookupFactory(name);
    assert('[audio-pledge] Could not find audio factory ${name}.', name);
    console.log(Factory);

    Factory.setup(config);
    return Factory;
  },

  /**
   * Looks up the factory from the container. Prioritizes the consuming app's
   * factories over the addon's factories.
   *
   * @method _lookupFactory
   * @param {String} factoryName
   * @private
   * @return {Factory} a local factory or an factory from the addon
   */

  _lookupFactory(factoryName) {
    assert('[audio-pledge] Could not find audio factory without a name.', factoryName);

    const dasherizedFactoryName = dasherize(factoryName);
    const availableFactory = getOwner(this).lookup(`audio-pledge@audio-pledge-factory:${dasherizedFactoryName}`);
    const localFactory = getOwner(this).lookup(`audio-pledge-factory:${dasherizedFactoryName}`);

    assert(`[audio-pledge] Could not load audio factory ${dasherizedFactoryName}`, (localFactory || availableFactory));

    return localFactory ? localFactory : availableFactory;
  }
});
