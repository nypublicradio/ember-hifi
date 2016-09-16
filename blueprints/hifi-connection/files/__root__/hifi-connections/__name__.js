import Ember from 'ember';
<%= importStatement %>
const {
  assert
} = Ember;

let ClassMethods = Ember.Mixin.create({
  setup() {
    // Do any global setup needed for your third party library.
  },
  
  canPlayExtension(/* extension */) {
    // check if connection can play file with this extension
    return true;
  },

  canUseConnection() {
    // check to see if this connection will work on this browser/platform
    return true;
  }
});

let Sound = BaseSound.extend({
  setup() {
    let url   = this.get('url');
    let sound = this;

    // Using the URL, try loading up your sound.

    // Wire up your audio library so it fires these events on this sound class

    // sound.trigger('audio-ready')                     -> when sound is ready to play
    // sound.trigger('audio-load-error', errorMessage)  -> when sound encounters an loading error
    // sound.trigger('audio-loading', info)             -> when sound is loading, optionally include {percentLoaded}

    // sound.trigger('audio-played')                    -> when sound is played
    // sound.trigger('audio-paused')                    -> when sound is paused
    // sound.trigger('audio-stopped')                   -> when sound is stopped
    // sound.trigger('audio-ended')                     -> when sound is finished playing
    // sound.trigger('audio-duration-changed')          -> when the audio duration changes
    // sound.trigger('audio-position-changed')          -> when the audio position changes
  },

  teardown() {

  },

  // implement these methods to control your sound

  _setVolume() {
    assert('[hifi-connection: <%= name %>] #_setVolume interface not implemented', false);
  },

  _audioDuration() {
    // return Infinity if source is an audio stream
    assert("[hifi-connection: <%= name %>] #_audioDuration interface not implemented", false);
  },

  _currentPosition() {
    assert("[hifi-connection: <%= name %>] #currentPosition interface not implemented", false);
  },

  _setPosition() {
    assert("[hifi-connection: <%= name %>] #setPosition interface not implemented", false);
  },

  play() {
    assert("[hifi-connection: <%= name %>] #play interface not implemented", false);
  },

  pause() {
    assert("[hifi-connection: <%= name %>] #pause interface not implemented", false);
  },

  stop() {
    // Stop playback and make sure no more audio is downloading
    assert("[hifi-connection: <%= name %>] #stop interface not implemented", false);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
