import Ember from 'ember';

const {
  assert,
  computed
} = Ember;

let ClassMethods = Ember.Mixin.create({
  setup(config) {
    this.config = config;
  },

  canPlay(url) {
    let urlExtension = url.split('.').pop().split('?').shift().split('#').shift();
    return this.canUseFactory(url) && this.canPlayExtension(urlExtension);
  },

  canUseFactory() {
    return true;
  },

  canPlayExtension(extension) {
    let whiteList = this.extensionWhiteList;
    let blackList = this.extensionBlackList;

    if (whiteList) {
      return Ember.A(whiteList).contains(extension);
    }
    else if (blackList){
      return !Ember.A(blackList).contains(extension);
    }
    else {
      return true; // assume true
    }
  }
});

let Sound = Ember.Object.extend(Ember.Evented, {
  logger:            Ember.inject.service('debug-logger'),
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
    assert("[audio-pledge] #setup interface not implemented", false);
  },

  _setVolume() {
    assert("[audio-pledge] #_setVolume interface not implemented", false);
  },

  _audioDuration() {
    assert("[audio-pledge] #audioDuration interface not implemented", false);
  },

  currentPosition() {
    assert("[audio-pledge] #currentPosition interface not implemented", false);
  },

  setPosition() {
    assert("[audio-pledge] #setPosition interface not implemented", false);
  },

  play() {
    assert("[audio-pledge] #play interface not implemented", false);
  },

  pause() {
    assert("[audio-pledge] #pause interface not implemented", false);
  },

  stop() {
    assert("[audio-pledge] #stop interface not implemented", false);
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
