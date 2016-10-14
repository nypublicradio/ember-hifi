import Ember from 'ember';
import { getMimeType } from 'ember-hifi/utils/mime-types';

const {
  assert,
  computed
} = Ember;

let ClassMethods = Ember.Mixin.create({
  setup(config) {
    this.config = config;
  },

  canPlay(url) {
    let usablePlatform = this.canUseConnection(url);
    if (!usablePlatform) {
      return false;
    }
    if (typeof url === 'string') {
      let mimeType = getMimeType(url);
      if (!mimeType) {
        console.warn(`Could not determine mime type for ${url}`);
        console.warn('Attempting to play urls with an unknown mime type can be bad for performance. See documentation for more info.');
        return true;
      }
      else {
        return this.canPlayMimeType(mimeType);
      }
    }
    else if (url.mimeType) {
      return this.canPlayMimeType(url.mimeType);
    }
    else {
      throw new Error('URL must be a string or object with a mimeType property');
    }
  },

  canUseConnection() {
    return true;
  },

  canPlayMimeType(mimeType) {
    let mimeTypeWhiteList = this.acceptMimeTypes;
    let mimeTypeBlackList = this.rejectMimeTypes;

    if (mimeTypeWhiteList) {
      return Ember.A(mimeTypeWhiteList).contains(mimeType);
    }
    else if (mimeTypeBlackList){
      return !Ember.A(mimeTypeBlackList).contains(mimeType);
    }
    else {
      return true; // assume true
    }
  }
});

let Sound = Ember.Object.extend(Ember.Evented, {
  logger:            Ember.inject.service('hifi-logger'),
  pollInterval:      1000,
  timeout:           30000,
  isLoading:         false,
  isPlaying:         false,
  isStream:          computed.equal('duration', Infinity),
  isFastForwardable: computed.not('isStream'),
  isRewindable:      computed.not('isStream'),

  duration:          0,
  percentLoaded:     0,

  // _position is updated by the service on the currently playing sound
  position:          computed('_position', {
    get() {
      return this._currentPosition();
    },
    set(k, v) {
      this._setPosition(v);
      return v;
    }
  }),

  init: function() {
    this.set('isLoading', true);

    this.on('audio-played',    () => {
      this.set('isLoading', false);
      this.set('isPlaying', true);
    });

    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-stopped',   () => this.set('isPlaying', false));

    this.on('audio-ready',    () => {
      this.set('duration', this._audioDuration());
    });

    this.on('audio-loaded', () => {
      this.set('isLoading', false);
    });

    this.on('audio-loading', (info) => {
      if (info && info.percentLoaded) {
        this.set('percentLoaded', info.percentLoaded);
      }
    });

    this._detectTimeouts();

    try {
      this.setup();
    }
    catch(e) {
      Ember.run.next(() => {
        this.trigger('audio-load-error', `Error in setup ${e.message}`);
      });
    }
  },

  _detectTimeouts() {
    if (this.get('timeout')) {
      let timeout = Ember.run.later(() => {
          this.trigger('audio-load-error', "request timed out");
      }, this.get('timeout'));

      this.on('audio-ready',      () => Ember.run.cancel(timeout));
      this.on('audio-load-error', () => Ember.run.cancel(timeout));
    }
  },

  debug(message) {
    this.get('logger').log(this.get('url'), message);
  },

  fastForward(duration) {
    let audioLength     = this._audioDuration();
    let currentPosition = this._currentPosition();
    let newPosition     = (currentPosition + duration);

    this._setPosition(newPosition > audioLength ? audioLength : newPosition);
  },

  rewind(duration) {
    let currentPosition = this._currentPosition();
    let newPosition     = (currentPosition - duration);

    this._setPosition(newPosition < 0 ? 0 : newPosition);
  },

  /* To be defined on the subclass */

  setup() {
    assert("[ember-hifi] #setup interface not implemented", false);
  },

  _setVolume() {
    assert("[ember-hifi] #_setVolume interface not implemented", false);
  },

  _audioDuration() {
    assert("[ember-hifi] #_audioDuration interface not implemented", false);
  },

  _currentPosition() {
    assert("[ember-hifi] #_currentPosition interface not implemented", false);
  },

  _setPosition() {
    assert("[ember-hifi] #_setPosition interface not implemented", false);
  },

  play() {
    assert("[ember-hifi] #play interface not implemented", false);
  },

  pause() {
    assert("[ember-hifi] #pause interface not implemented", false);
  },

  stop() {
    assert("[ember-hifi] #stop interface not implemented", false);
  },

  teardown() {
    // optionally implemented in subclasses
  },

  willDestroy() {
    this.teardown();
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
