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
  logger:         Ember.inject.service('debug-logger'),
  pollInterval:   1000,
  timeout:        15000,
  isLoading:      false,
  isPlaying:      false,
  duration:       0,
  isStream:       computed.equal('duration', Infinity),
  canFastForward: computed.not('isStream'),
  canRewind:      computed.not('isStream'),
  position:       0,

  init: function() {
    this.set('isLoading', true);

    this.on('audio-played',    () => {
      this.set('isLoading', false);
      this.set('isPlaying', true);
    });

    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-stopped',   () => this.set('isPlaying', false));

    this.on('audio-ready',    () => {
      this.set('duration', this.audioDuration());
    });

    this.on('audio-loaded', () => {
      this.set('isLoading', false);
    });

    this._detectTimeouts();
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

  /* To be defined on the subclass */

  _setVolume() {
    assert("[audio-pledge] #_setVolume interface not implemented", false);
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

  forward() {
    assert("[audio-pledge] #forward interface not implemented", false);
  },

  rewind() {
    assert("[audio-pledge] #rewind interface not implemented", false);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
