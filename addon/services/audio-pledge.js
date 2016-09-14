import Ember from 'ember';
import OneAtATime from '../helpers/one-at-a-time';
import getOwner from 'ember-getowner-polyfill';
import RSVP from 'rsvp';
import PromiseRace from '../utils/promise-race';

const {
  Service,
  computed,
  getWithDefault,
  getProperties,
  assert,
  get,
  set,
  A: emberArray,
  String: { dasherize }
} = Ember;

export default Service.extend(Ember.Evented, {
  soundCache:        Ember.inject.service('sound-cache'),
  logger:            Ember.inject.service('debug-logger'),
  isMobileDevice:    computed({
    get() {
      return ('ontouchstart' in window);
    },
    set(k, v) { return v; }
  }),

  currentSound:      null,
  isPlaying:         computed.readOnly('currentSound.isPlaying'),
  isLoading:         computed('currentSound.isLoading', {
    get() {
      return this.get('currentSound.isLoading');
    },
    set(k, v) { return v; }
  }),

  isStream:          computed.readOnly('currentSound.isStream'),
  isFastForwardable: computed.readOnly('currentSound.canFastForward'),
  isRewindable:      computed.readOnly('currentSound.canRewind'),
  isMuted:           computed.equal('volume', 0),
  position:          computed.alias('currentSound.position'),
  duration:          computed.readOnly('currentSound.duration'),
  percentLoaded:     computed.readOnly('currentSound.percentLoaded'),
  pollInterval:      500,

  defaultVolume: 50,

  volume: computed({
    get() {
      return this.get('currentSound.volume') || this.get('defaultVolume');
    },
    set(k, v) {
      if (this.get('currentSound')) {
        this.get('currentSound')._setVolume(v);
      }

      return v;
    }
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
    const factories = getWithDefault(this, 'options.audioPledge.factories', emberArray());
    const owner = getOwner(this);
    const debugEnabled = getWithDefault(this, 'options.audioPledge.debug', false);
    this._setupDebugger(debugEnabled);

    owner.registerOptionsForType('audio-pledge@audio-pledge-factory', { instantiate: false });
    owner.registerOptionsForType('audio-pledge-factory', { instantiate: false });

    set(this, 'appEnvironment', getWithDefault(this, 'options.environment', 'development'));
    set(this, '_factories', {});
    set(this, 'oneAtATime', new OneAtATime());
    set(this, 'volume', 50);
    this._activateFactories(factories);

    this.set('isReady', true);

    this._pollCurrentSoundForPosition();

    this._super(...arguments);
  },

  /**
   * Returns the list of activated and available factories
   *
   * @method availableFactories
   * @param {Void}
   * @return {Array}
   */

  availableFactories() {
    return Object.keys(this.get('_factories'));
  },

  /**
   * Given an array of URLS, return a sound ready for playing
   *
   * @method load
   * @param {Array} urls
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error
   */

  load(urlsOrPromise, options) {
    let audioElement = this._createAndUnlockAudio();

    options = Ember.assign({ debugName: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 3)}, options);

    let promise = new RSVP.Promise((resolve, reject) => {
      return this._resolveUrls(urlsOrPromise).then(urlsToTry => {
        if (Ember.isEmpty(urlsToTry)) {
          reject({error: "Urls must be provided"});
        }

        let sound = this.get('soundCache').find(urlsToTry);
        if (sound) {
          resolve({sound});
        }
        else {
          this.set('isLoading', true);
          let strategies = [];
          if (options.useFactories) {
            // If the consumer has specified a factory to prefer, use it
            let factoryNames  = options.useFactories;
            strategies = this._prepareStrategies(urlsToTry, factoryNames);
          }
          else if (this.get('isMobileDevice')) {
            // If we're on a mobile device, we want to try NativeAudio first
            strategies  = this._prepareMobileStrategies(urlsToTry);
          }
          else {
            strategies  = this._prepareStandardStrategies(urlsToTry);
          }

          if (this.get('isMobileDevice')) {
            // If we're on a mobile device, attach the audioElement to be passed
            // into each factory to combat autoplay blocking issues on touch devices
            strategies  = strategies.map(s => {
              s.audioElement = audioElement;
              return s;
            });
          }

          let search      = this._findFirstPlayableSound(strategies, options);
          search.then(results  => resolve({sound: results.success, failures: results.failures}));
          search.catch(results => reject({failures: results.failures}));

          return search;
        }
      });
    });

    promise.then(({sound}) => this.get('soundCache').cache(sound));

    // On audio-played this pauses all the other sounds. One at a time!
    promise.then(({sound}) => this.get('oneAtATime').register(sound));
    promise.then(({sound}) => sound.on('audio-played', () => this.setCurrentSound(sound)));

    return promise;
  },

  /**
   * Given an array of URLs, return a sound and play it.
   *
   * @method play
   * @param {Array} urls
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error
   */

  play(urlsOrPromise, options) {
    if (this.get('isPlaying')) {
      this.pause();
    }

    let load = this.load(urlsOrPromise, options);
    load.then(({sound}) => {
      this.debug("audio-pledge", "Finished load, trying to play sound");
      this._attemptToPlaySound(sound);
    });

    // We want to keep this chainable elsewhere
    return load;
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
   * Pauses the current sound
   *
   * @method pause
   * @param {Void}
   * @returns {Void}
   */

  stop() {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
    this.get('currentSound').stop();
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
   * @param {Integer} duration in ms
   * @returns {Void}
   */

  fastForward(duration) {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
    this.get('currentSound').fastForward(duration);
  },

  /**
   * Rewinds current sound if able
   *
   * @method rewind
   * @param {Integer} duration in ms
   * @returns {Void}
   */

  rewind(duration) {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));
    this.get('currentSound').rewind(duration);
  },

  /**
   * Sets position of the playhead on the current sound
   *
   * @method setPosition
   * @param {Integer} duration in ms
   * @returns {Void}
   */

  setPosition(position) {
    assert('[audio-pledge] Nothing is playing.', this.get('currentSound'));

    this.get('currentSound').setPosition(position);
  },

  /**
   * Set the current sound and wire up all the events the sound fires so they
   * trigger through the service, remove the ones on the previous current sound,
   * and set the new current sound to the system volume
   *
   * @method setCurrentSound
   * @param {sound}
   * @returns {void}
   */

  setCurrentSound(sound) {
    this._unregisterEvents(this.get('currentSound'));
    this._registerEvents(sound);
    sound._setVolume(this.get('volume'));
    this.set('currentSound', sound);
  },

/* ------------------------ PRIVATE(ISH) METHODS ---------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

  /**
   * Polls the current sound for position. We wanted to make it easy/flexible
   * for factory authors, and since we only play one sound at a time, we don't
   * need other non-active sounds telling us position info
   *
   * @method _pollCurrentSoundForPosition
   * @param {Void}
   * @private
   * @return {Void}
   */

  _pollCurrentSoundForPosition: function() {
    this._setCurrentPosition();
    Ember.run.later(() =>  this._pollCurrentSoundForPosition(), get(this, 'pollInterval'));
  },

  /**
   * Sets the current sound with its current position, so the sound doesn't have
   * to deal with timers. The service runs the show.
   *
   * @method _pollCurrentSoundForPosition
   * @param {Void}
   * @private
   * @return {Void}
   */

  _setCurrentPosition() {
    let sound = this.get('currentSound');
    if (sound) {
      try {
        set(sound, 'position', sound.currentPosition());
      }
      catch(e) {

      }
    }
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
    sound.on('audio-played',           () => this._relayEvent('audio-played', sound));
    sound.on('audio-paused',           () => this._relayEvent('audio-paused', sound));
    sound.on('audio-stopped',          () => this._relayEvent('audio-stopped', sound));
    sound.on('audio-ended',            () => this._relayEvent('audio-ended', sound));
    sound.on('audio-duration-changed', () => this._relayEvent('audio-duration-changed', sound));
    sound.on('audio-position-changed', () => this._relayEvent('audio-position-changed', sound));
    sound.on('audio-loaded',           () => this._relayEvent('audio-loaded', sound));
    sound.on('audio-loading',          () => this._relayEvent('audio-loading', sound));
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
    sound.off('audio-played',           () => this._relayEvent('audio-played', sound));
    sound.off('audio-paused',           () => this._relayEvent('audio-paused', sound));
    sound.off('audio-stopped',          () => this._relayEvent('audio-stopped', sound));
    sound.off('audio-ended',            () => this._relayEvent('audio-ended', sound));
    sound.off('audio-duration-changed', () => this._relayEvent('audio-duration-changed', sound));
    sound.off('audio-position-changed', () => this._relayEvent('audio-position-changed', sound));
    sound.off('audio-loaded',           () => this._relayEvent('audio-loaded', sound));
    sound.off('audio-loading',          () => this._relayEvent('audio-loading', sound));
  },

  /**
   * Relays an audio event on the sound to an event on the service
   *
   * @method relayEvent
   * @param {String, Object} eventName, sound
   * @private
   * @return {Void}
   */

  _relayEvent(eventName, sound) {
    this.trigger(eventName, sound);
  },

  /**
   * Selects loaded factories by name
   *
   * @method selectFactoriesByName
   * @param {Array} names
   * @return [Factory] by names
   */

  selectFactoriesByName(names) {
    names = Ember.makeArray(names);
    let factories = this.availableFactories();
    return getProperties(factories, names);
  },

  /**
   * Selects a compatiable factory based on the URL
   *
   * @method selectWorkingFactories
   * @param {Array} urls
   * @return {Array} activated factories that claim they can play the URL
   */

  selectWorkingFactories(url) {
    let factoryNames      = this.availableFactories();
    let factories         = factoryNames.map(name => this.get(`_factories.${name}`));

    return factories.filter(f => f.canPlay(url));
  },

  /**
   * Activates the factories as specified in the config options
   *
   * @method _activateFactories
   * @private
   * @param {Array} factoryOptions
   * @return {Object} instantiated factories
   */

  _activateFactories(factoryOptions = []) {
    const cachedFactories = get(this, '_factories');
    const activatedFactories = {};

    factoryOptions.forEach((factoryOption) => {
      const { name } = factoryOption;
      const factory = cachedFactories[name] ? cachedFactories[name] : this._activateFactory(factoryOption);

      set(activatedFactories, name, factory);
    });

    return set(this, '_factories', activatedFactories);
  },

 /**
  * Activates the a single factory
  *
  * @method _activateFactory
  * @private
  * @param {Object} {name, config}
  * @return {Factory} instantiated Factory
  */

  _activateFactory({ name, config } = {}) {
    const Factory = this._lookupFactory(name);
    assert('[audio-pledge] Could not find audio factory ${name}.', name);
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
  },

  /**
   * URLs given to load or play may be a promise, resolve this promise and get the urls
   * or promisify an array/string and
   * @method _resolveUrls
   * @param {Array or String or Promise} urlOrPromise
   * @private
   * @returns {Promise.<urls>} a promise resolving to a cleaned up array of URLS
   */

  _resolveUrls(urlsOrPromise) {
    let prepare = (urls) => {
      return Ember.A(Ember.makeArray(urls)).uniq().reject(i => Ember.isEmpty(i));
    };

    if (urlsOrPromise.then) {
      this.debug('audio-pledge', "#load passed URL promise");
    }

    return RSVP.Promise.resolve(urlsOrPromise).then(urls => {
      urls = prepare(urls);
      this.debug('audio-pledge', `given urls: ${urls.join(', ')}`);
      return urls;
    });
  },

  /**
   * Given an array of strategies with {factory, url} try the factory and url
   * return the first thing that works
   *
   * @method _findFirstPlayableSound
   * @param {Array} urlsToTry
   * @private
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error
   */

  _findFirstPlayableSound(strategies, options) {
    this.timeStart(options.debugName, "_findFirstPlayableSound");

    let promise = PromiseRace.start(strategies, (strategy, returnSuccess, markAsFailure) => {
      let Factory        = strategy.factory;
      let factoryOptions = getProperties(strategy, 'url', 'factoryName', 'audioElement');
      let sound          = Factory.create(factoryOptions);

      this.debug(options.debugName, `TRYING: [${strategy.factoryName}] -> ${strategy.url}`);

      sound.one('audio-load-error', (error) => {
        strategy.error = error;
        markAsFailure(strategy);
        this.debug(options.debugName, `FAILED: [${strategy.factoryName}] -> ${error} (${strategy.url})`);
      });

      sound.one('audio-ready',      () => {
        returnSuccess(sound);
        this.debug(options.debugName, `SUCCESS: [${strategy.factoryName}] -> (${strategy.url})`);
      });
    });

    promise.finally(() => this.timeEnd(options.debugName, "_findFirstPlayableSound"));

    return promise;
  },

  /**
   * Given some urls, it prepares an array of factory and url pairs to try
   *
   * @method _prepareParamsForLoadWorkingAudio
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {factory, url}
   */

  /**
   * Take our standard strategy and reorder it to prioritize native audio
   * first since it's most likely to succeed and play immediately with our
   * audio unlock logic

   * we try each url on each compatible factory in order
   * [{factory: NativeAudio, url: url1},
   *  {factory: NativeAudio, url: url2},
   *  {factory: HLS, url: url1},
   *  {factory: Other, url: url1},
   *  {factory: HLS, url: url2},
   *  {factory: Other, url: url2}]

   * @method _prepareMobileStrategies
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {factory, url}
   */

  _prepareMobileStrategies(urlsToTry) {
    let strategies = this._prepareStandardStrategies(urlsToTry);
    this.debug("modifying standard strategy for to work best on mobile");

    let nativeStrategies  = Ember.A(strategies).filter(s => (s.factoryName === 'NativeAudio'));
    let otherStrategies   = Ember.A(strategies).reject(s => (s.factoryName === 'NativeAudio'));
    let orderedStrategies = nativeStrategies.concat(otherStrategies);

    return orderedStrategies;
  },

  /**
   * Given a list of urls, prepare the strategy that we think will succeed best
   *
   * Breadth first: we try each url on each compatible factory in order
   * [{factory: NativeAudio, url: url1},
   *  {factory: HLS, url: url1},
   *  {factory: Other, url: url1},
   *  {factory: NativeAudio, url: url2},
   *  {factory: HLS, url: url2},
   *  {factory: Other, url: url2}]

   * @method _prepareStandardStrategies
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {factory, url}
   */

  _prepareStandardStrategies(urlsToTry, options) {
    return this._prepareStrategies(urlsToTry, this.availableFactories(), options);
  },

  /**
   * Given a list of urls and a list of factories, assemble array of
   * strategy objects to be tried in order. Each strategy object
   * should contain a factory, a factoryName, a url, and in some cases
   * an audioElement

   * @method _prepareStrategies
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {factory, url}
   */

  _prepareStrategies(urlsToTry, factoryNames) {
    factoryNames = Ember.makeArray(factoryNames);
    let strategies = [];

    urlsToTry.forEach(url => {
      let factorySuccesses = [];
      factoryNames.forEach(factoryName => {
        let factory = this.get(`_factories.${factoryName}`);
        if (factory.canPlay(url)) {
          factorySuccesses.push(factoryName);
          strategies.push({
            factoryName:  factoryName,
            factory:      factory,
            url:          url
          });
        }
      });
      this.debug(`Compatible factories for ${url}: ${factorySuccesses.join(", ")}`);
    });
    return strategies;
  },

  /**
   * Creates an empty audio element and plays it to unlock audio on a mobile (iOS)
   * device at the beggining of a play event.
   *
   * @method _createAndUnlockAudio
   * @private
   * @param {Void}
   * @returns {element} an audio element
   */

   _createAndUnlockAudio() {
    let audioElement = document.createElement('audio');
    audioElement.play();

    return audioElement;
  },

  /**
   * Attempts to play the sound after a load, which in certain cases can fail on mobile
   * @method _attemptToPlaySoundOnMobile
   * @param {sound}
   * @private
   * @returns {void}
   */

  _attemptToPlaySound(sound) {
    if (this.get('isMobileDevice')) {
      let blockCheck = Ember.run.later(() => {
        this.debug(`Looks like the mobile browser blocked an autoplay trying to play sound with url: ${sound.get('url')}`);
      }, 1000);
      sound.one('audio-played', () => Ember.run.cancel(blockCheck));
    }
    sound.play();
  },

  /**
   * Make the debug log service a little nicer to interact with in this service
   * @method _setupDebugger
   * @param {void}
   * @private
   * @returns {void}
   */

  _setupDebugger(enabled) {
    let logger = this.get('logger');
    logger.set('enabled', enabled);

    this.debug = function() {
      if (arguments.length === 1) {
        logger.log('audio-pledge', arguments[0]);
      }
      else if (arguments.length === 2) {
        logger.log(arguments[0], arguments[1]);
      }
    };

    this.timeStart = function() {
      logger.timeStart(...arguments);
    };

    this.timeEnd = function() {
      logger.timeEnd(...arguments);
    };
  }

});
