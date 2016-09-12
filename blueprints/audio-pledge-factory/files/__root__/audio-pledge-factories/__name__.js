import Ember from 'ember';
<%= importStatement %>
const {
  assert
} = Ember;

let ClassMethods = Ember.Mixin.create({
  canPlayExtension(/* extension */) {
    // TODO: check if factory can play file with this extension
    return true;
  },

  canUseFactory() {
    // TODO: check to see if this factory will work on this browser/platform
    return true;
  }
});

let Sound = BaseSound.extend({
  init() {
    this._super(...arguments);
    let url   = this.get('url');
    let sound = this;

    // TODO: using the URL, try loading up your sound.

    // TODO: wire up your audio library so it fires these events on this sound class

    // sound.trigger('audio-ready')                     -> when sound is ready to play
    // sound.trigger('audio-load-error', errorMessage)  -> when sound encounters an loading error

    // sound.trigger('audio-played')                    -> when sound is played
    // sound.trigger('audio-paused')                    -> when sound is paused
    // sound.trigger('audio-stopped')                   -> when sound is stopped
    // sound.trigger('audio-ended')                     -> when sound is finished playing
    // sound.trigger('audio-duration-changed')          -> when the audio duration changes
    // sound.trigger('audio-position-changed')          -> when the audio position changes
  },

  // TODO: implement these methods to control your sound

  _setVolume() {
    assert('[audio-pledge-factory: <%= name %>] #_setVolume interface not implemented', false);
  },

  audioDuration() {
    // TODO: return Infinity if source is an audio stream
    assert("[audio-pledge-factory: <%= name %>] #audioDuration interface not implemented", false);
  },

  currentPosition() {
    assert("[audio-pledge-factory: <%= name %>] #currentPosition interface not implemented", false);
  },

  setPosition() {
    assert("[audio-pledge-factory: <%= name %>] #setPosition interface not implemented", false);
  },

  play() {
    assert("[audio-pledge-factory: <%= name %>] #play interface not implemented", false);
  },

  pause() {
    assert("[audio-pledge-factory: <%= name %>] #pause interface not implemented", false);
  },

  stop() {
    assert("[audio-pledge-factory: <%= name %>] #stop interface not implemented", false);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
