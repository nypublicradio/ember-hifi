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
  currentSound: null,

  isPlaying: computed.alias('currentSound.isPlaying'),
  isLoading: computed.alias('currentSound.isLoading'),
  canFastForward: computed.alias('currentSound.canFastForward'),

  init() {
    const factories = getWithDefault(this, 'options.audioPledgeFactories', emberArray());
    const owner = getOwner(this);
    owner.registerOptionsForType('audio-pledge@audio-pledge-factory', { instantiate: false });
    owner.registerOptionsForType('audio-pledge-factory', { instantiate: false });

    set(this, 'appEnvironment', getWithDefault(this, 'options.environment', 'development'));
    set(this, '_factories', {});

    this.activateFactories(factories);
    set(this, 'soundCache', new SoundCache());
    set(this, 'oneAtATime', new OneAtATime());

    this.set('isReady', true);
    this._super(...arguments);

    RSVP.on('error', (e) => {
      throw(e);
    });
  },

  create(urls) {
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
        let sound = SoundFactory.create({urls: urls, service: this});

        sound.on('audio-ready', resolve);
        sound.on('audio-load-error', reject);
      }
    });
    promise.then(sound => this.get('soundCache').cache(sound));
    promise.then(sound => this.get('oneAtATime').register(sound));

    return promise;
  },

  play(urls) {
    let promise = this.create(urls);
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

  selectFactory(/* urls */) {
    // Select a random factory for testing

    let factories = this.get('_factories');
    let options = Object.keys(factories);
    let choice = options[Math.floor(Math.random() * options.length)];
    choice = 'howler';
    console.log(`Choosing ${choice} factory`);
    return this.get(`_factories.${choice}`);
  },

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
