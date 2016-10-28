import Ember from 'ember';
import OneAtATime from '../helpers/one-at-a-time';
import getOwner from 'ember-getowner-polyfill';
import RSVP from 'rsvp';
import PromiseRace from '../utils/promise-race';
import AccessControl from '../utils/access-control';
import { bind } from 'ember-runloop';

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
  poll:              Ember.inject.service(),
  soundCache:        Ember.inject.service('hifi-cache'),
  logger:            Ember.inject.service('hifi-logger'),
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
  isFastForwardable: computed.readOnly('currentSound.isFastForwardable'),
  isRewindable:      computed.readOnly('currentSound.isRewindable'),
  isMuted:           computed.equal('volume', 0),
  duration:          computed.readOnly('currentSound.duration'),
  percentLoaded:     computed.readOnly('currentSound.percentLoaded'),
  pollInterval:      500,

  defaultVolume: 50,

  position:          computed.alias('currentSound.position'),

  volume: computed({
    get() {
      return this.get('currentSound.volume') || this.get('defaultVolume');
    },
    set(k, v) {
      if (this.get('currentSound')) {
        this.get('currentSound')._setVolume(v);
      }

      if (v > 0) {
        this.set('unmuteVolume', v);
      }

      return v;
    }
  }),

  /**
   * When the Service is created, activate connections that were specified in the
   * configuration. This config is injected into the Service as `options`.
   *
   * @method init
   * @param {Void}
   * @return {Void}
   */

  init() {
    const connections = getWithDefault(this, 'options.emberHifi.connections', emberArray());
    const owner = getOwner(this);
    const debugEnabled = getWithDefault(this, 'options.emberHifi.debug', false);
    this._setupDebugger(debugEnabled);

    owner.registerOptionsForType('ember-hifi@hifi-connection', { instantiate: false });
    owner.registerOptionsForType('hifi-connection', { instantiate: false });

    set(this, 'appEnvironment', getWithDefault(this, 'options.environment', 'development'));
    set(this, '_connections', {});
    set(this, 'oneAtATime', OneAtATime.create());
    set(this, 'volume', 50);
    this._activateConnections(connections);

    this.set('isReady', true);

   // Polls the current sound for position. We wanted to make it easy/flexible
   // for connection authors, and since we only play one sound at a time, we don't
   // need other non-active sounds telling us position info
    this.get('poll').addPoll({
      interval: get(this, 'pollInterval'),
      callback: bind(this, this._setCurrentPosition)
    });

    this._super(...arguments);
  },

  /**
   * Returns the list of activated and available connections
   *
   * @method availableConnections
   * @param {Void}
   * @return {Array}
   */

  availableConnections() {
    return Object.keys(this.get('_connections'));
  },

  /**
   * Given an array of URLS, return a sound ready for playing
   *
   * @method load
   * @param {Array} urls
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error
   */

  load(urlsOrPromise, options) {
    let audioAccess = this._createAndUnlockAudio();
    let assign = Ember.assign || Ember.merge;

    options = assign({ debugName: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 3)}, options);

    let promise = new RSVP.Promise((resolve, reject) => {
      return this._resolveUrls(urlsOrPromise).then(urlsToTry => {
        if (Ember.isEmpty(urlsToTry)) {
          return reject(new Error('[ember-hifi] URLs must be provided'));
        }

        let sound = this.get('soundCache').find(urlsToTry);
        if (sound) {
          this.debug('ember-hifi', 'retreived sound from cache');
          this.set('isLoading', false);
          return resolve({sound});
        }
        else {
          let strategies = [];
          if (options.useConnections) {
            // If the consumer has specified a connection to prefer, use it
            let connectionNames  = options.useConnections;
            strategies = this._prepareStrategies(urlsToTry, connectionNames);
          }
          else if (this.get('isMobileDevice')) {
            // If we're on a mobile device, we want to try NativeAudio first
            strategies  = this._prepareMobileStrategies(urlsToTry);
          }
          else {
            strategies  = this._prepareStandardStrategies(urlsToTry);
          }

          // pass in audioAccess for whomever might need it
          strategies  = strategies.map(s => {
            s.audioAccess = audioAccess;
            return s;
          });

          let search = this._findFirstPlayableSound(strategies, options);
          search.then(results  => resolve({sound: results.success, failures: results.failures}));

          return search;
        }
      })
      .catch(e => {
        // reset the UI since trying to play that sound failed
        this.set('isLoading', false);
        let err = new Error(`[ember-hifi] URL Promise failed because: ${e.message}`);
        err.failures = e.failures;
        reject(err);
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
    // update the UI immediately while `.load` figures out which sound is playable
    this.set('isLoading', true);

    let load = this.load(urlsOrPromise, options);
    load.then(({sound}) => {
      this.debug("ember-hifi", "Finished load, trying to play sound");
      this._attemptToPlaySound(sound, options);
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
    assert('[ember-hifi] Nothing is playing.', this.get('currentSound'));
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
    assert('[ember-hifi] Nothing is playing.', this.get('currentSound'));
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
    assert('[ember-hifi] Nothing is playing.', this.get('currentSound'));

    if (this.get('isPlaying')) {
      this.get('currentSound').pause();
    }
    else {
      this.get('currentSound').play();
    }
  },

  /**
   * Toggles mute state. Sets volume to zero on mute, resets volume to the last level it was before mute, unless
   * unless the last level was zero, in which case it sets it to the default volume
   *
   * @method pause
   * @param {Void}
   * @returns {Void}
   */

  toggleMute() {
    if (this.get('isMuted')) {
      this.set('volume', this.get('unmuteVolume'));
    }
    else {
      this.set('volume', 0);
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
    assert('[ember-hifi] Nothing is playing.', this.get('currentSound'));
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
    assert('[ember-hifi] Nothing is playing.', this.get('currentSound'));
    this.get('currentSound').rewind(duration);
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
   * Sets the current sound with its current position, so the sound doesn't have
   * to deal with timers. The service runs the show.
   *
   * @method _setCurrentSoundForPosition
   * @param {Void}
   * @private
   * @return {Void}
   */

  _setCurrentPosition() {
    let sound = this.get('currentSound');
    if (sound) {
      try {
        set(sound, '_position', sound._currentPosition());
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
    let service = this;
    sound.on('audio-played',           service,   service._relayPlayedEvent);
    sound.on('audio-paused',           service,   service._relayPausedEvent);
    sound.on('audio-stopped',          service,   service._relayStoppedEvent);
    sound.on('audio-ended',            service,   service._relayEndedEvent);
    sound.on('audio-duration-changed', service,   service._relayDurationChangedEvent);
    sound.on('audio-position-changed', service,   service._relayPositionChangedEvent);
    sound.on('audio-loaded',           service,   service._relayLoadedEvent);
    sound.on('audio-loading',          service,   service._relayLoadingEvent);
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
    let service = this;
    sound.off('audio-played',           service,   service._relayPlayedEvent);
    sound.off('audio-paused',           service,   service._relayPausedEvent);
    sound.off('audio-stopped',          service,   service._relayStoppedEvent);
    sound.off('audio-ended',            service,   service._relayEndedEvent);
    sound.off('audio-duration-changed', service,   service._relayDurationChangedEvent);
    sound.off('audio-position-changed', service,   service._relayPositionChangedEvent);
    sound.off('audio-loaded',           service,   service._relayLoadedEvent);
    sound.off('audio-loading',          service,   service._relayLoadingEvent);
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
    Named functions so Ember Evented can successfully register/unregister them
  */

  _relayPlayedEvent(sound) {
    this._relayEvent('audio-played', sound);
  },
  _relayPausedEvent(sound) {
    this._relayEvent('audio-paused', sound);
  },
  _relayStoppedEvent(sound) {
    this._relayEvent('audio-stopped', sound);
  },
  _relayEndedEvent(sound) {
    this._relayEvent('audio-ended', sound);
  },
  _relayDurationChangedEvent(sound) {
    this._relayEvent('audio-duration-changed', sound);
  },
  _relayPositionChangedEvent(sound) {
    this._relayEvent('audio-position-changed', sound);
  },
  _relayLoadedEvent(sound) {
    this._relayEvent('audio-loaded', sound);
  },
  _relayLoadingEvent(sound) {
    this._relayEvent('audio-loading', sound);
  },

  /**
   * Activates the connections as specified in the config options
   *
   * @method _activateConnections
   * @private
   * @param {Array} connectionOptions
   * @return {Object} instantiated connections
   */

  _activateConnections(options = []) {
    const cachedConnections = get(this, '_connections');
    const activatedConnections = {};

    options.forEach((connectionOption) => {
      const { name } = connectionOption;
      const connection = cachedConnections[name] ? cachedConnections[name] : this._activateConnection(connectionOption);

      set(activatedConnections, name, connection);
    });

    return set(this, '_connections', activatedConnections);
  },

 /**
  * Activates the a single connection
  *
  * @method _activateConnection
  * @private
  * @param {Object} {name, config}
  * @return {Connection} instantiated Connection
  */

  _activateConnection({ name, config } = {}) {
    const Connection = this._lookupConnection(name);
    assert('[ember-hifi] Could not find hifi connection ${name}.', name);
    Connection.setup(config);
    return Connection;
  },

  /**
   * Looks up the connection from the container. Prioritizes the consuming app's
   * connections over the addon's connections.
   *
   * @method _lookupConnection
   * @param {String} connectionName
   * @private
   * @return {Connection} a local connection or a connection from the addon
   */

  _lookupConnection(connectionName) {
    assert('[ember-hifi] Could not find a hifi connection without a name.', connectionName);

    const dasherizedConnectionName = dasherize(connectionName);
    const availableConnection      = getOwner(this).lookup(`ember-hifi@hifi-connection:${dasherizedConnectionName}`);
    const localConnection          = getOwner(this).lookup(`hifi-connection:${dasherizedConnectionName}`);

    assert(`[ember-hifi] Could not load hifi connection ${dasherizedConnectionName}`, (localConnection || availableConnection));

    return localConnection ? localConnection : availableConnection;
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
      this.debug('ember-hifi', "#load passed URL promise");
    }

    return RSVP.Promise.resolve(urlsOrPromise).then(urls => {
      urls = prepare(urls);
      this.debug('ember-hifi', `given urls: ${urls.join(', ')}`);
      return urls;
    });
  },

  /**
   * Given an array of strategies with {connection, url} try the connection and url
   * return the first thing that works
   *
   * @method _findFirstPlayableSound
   * @param {Array} urlsToTry
   * @private
   * @returns {Promise.<Sound|error>} A sound that's ready to be played, or an error with a failures property
   */

  _findFirstPlayableSound(strategies, options) {
    this.timeStart(options.debugName, "_findFirstPlayableSound");

    let promise = PromiseRace.start(strategies, (strategy, returnSuccess, markAsFailure) => {
      let Connection         = strategy.connection;
      let connectionOptions  = getProperties(strategy, 'url', 'connectionName', 'audioAccess');
      let sound              = Connection.create(connectionOptions);

      this.debug(options.debugName, `TRYING: [${strategy.connectionName}] -> ${strategy.url}`);

      sound.one('audio-load-error', (error) => {
        strategy.error = error;
        markAsFailure(strategy);
        this.debug(options.debugName, `FAILED: [${strategy.connectionName}] -> ${error} (${strategy.url})`);
      });

      sound.one('audio-ready',      () => {
        returnSuccess(sound);
        this.debug(options.debugName, `SUCCESS: [${strategy.connectionName}] -> (${strategy.url})`);
      });
    });

    promise.finally(() => this.timeEnd(options.debugName, "_findFirstPlayableSound"));

    return promise;
  },

  /**
   * Given some urls, it prepares an array of connection and url pairs to try
   *
   * @method _prepareParamsForLoadWorkingAudio
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {connection, url}
   */

  /**
   * Take our standard strategy and reorder it to prioritize native audio
   * first since it's most likely to succeed and play immediately with our
   * audio unlock logic

   * we try each url on each compatible connection in order
   * [{connection: NativeAudio, url: url1},
   *  {connection: NativeAudio, url: url2},
   *  {connection: HLS, url: url1},
   *  {connection: Other, url: url1},
   *  {connection: HLS, url: url2},
   *  {connection: Other, url: url2}]

   * @method _prepareMobileStrategies
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {connection, url}
   */

  _prepareMobileStrategies(urlsToTry) {
    let strategies = this._prepareStandardStrategies(urlsToTry);
    this.debug("modifying standard strategy for to work best on mobile");

    let nativeStrategies  = Ember.A(strategies).filter(s => (s.connectionName === 'NativeAudio'));
    let otherStrategies   = Ember.A(strategies).reject(s => (s.connectionName === 'NativeAudio'));
    let orderedStrategies = nativeStrategies.concat(otherStrategies);

    return orderedStrategies;
  },

  /**
   * Given a list of urls, prepare the strategy that we think will succeed best
   *
   * Breadth first: we try each url on each compatible connection in order
   * [{connection: NativeAudio, url: url1},
   *  {connection: HLS, url: url1},
   *  {connection: Other, url: url1},
   *  {connection: NativeAudio, url: url2},
   *  {connection: HLS, url: url2},
   *  {connection: Other, url: url2}]

   * @method _prepareStandardStrategies
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {connection, url}
   */

  _prepareStandardStrategies(urlsToTry, options) {
    return this._prepareStrategies(urlsToTry, this.availableConnections(), options);
  },

  /**
   * Given a list of urls and a list of connections, assemble array of
   * strategy objects to be tried in order. Each strategy object
   * should contain a connection, a connectionName, a url, and in some cases
   * an audioAccess

   * @method _prepareStrategies
   * @param {Array} urlsToTry
   * @private
   * @return {Array} {connection, url}
   */

  _prepareStrategies(urlsToTry, connectionNames) {
    connectionNames = Ember.makeArray(connectionNames);
    let strategies = [];

    urlsToTry.forEach(url => {
      let connectionSuccesses = [];
      connectionNames.forEach(name => {
        let connection = this.get(`_connections.${name}`);
        if (connection.canPlay(url)) {
          connectionSuccesses.push(name);
          strategies.push({
            connectionName:  name,
            connection:      connection,
            url:             url.url || url
          });
        }
      });
      this.debug(`Compatible connections for ${url}: ${connectionSuccesses.join(", ")}`);
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
    return AccessControl.unlock();
  },

  /**
   * Attempts to play the sound after a load, which in certain cases can fail on mobile
   * @method _attemptToPlaySoundOnMobile
   * @param {sound}
   * @private
   * @returns {void}
   */

  _attemptToPlaySound(sound, options) {
    if (this.get('isMobileDevice')) {
      let blockCheck = Ember.run.later(() => {
        this.debug(`Looks like the mobile browser blocked an autoplay trying to play sound with url: ${sound.get('url')}`);
      }, 2000);
      sound.one('audio-played', () => Ember.run.cancel(blockCheck));
    }
    sound.play(options);
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
        logger.log('ember-hifi', arguments[0]);
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
