import Ember from 'ember';
import BaseSound from './base';
import { Howl } from 'howler';

export default BaseSound.extend({
  init() {
    this._super(...arguments);

    let urls = this.get('url');
    if (!Ember.isArray(urls)) {
      urls = [urls];
    }
    let sound = this;
    this.set('isLoading', true);

    new Howl({
      src:      urls,
      volume:   1,
      autoplay: false,
      preload:  true,
      html5:    true,
      onload: function() {
        sound.set('url', this._src);
        sound.set('howl', this);
        sound.trigger('audio-loaded', sound);
        sound.trigger('audio-ready', sound);
      },
      onpause: function() {
        sound.trigger('audio-paused', sound);
      },
      onplay: function() {
        sound.trigger('audio-played', sound);
      },
      onend: function() {
        sound.trigger('audio-ended', sound);
      },
      onloaderror: function(id, error) {
        sound.trigger('audio-load-error', sound);
        sound.trigger('error', error);
      }
    });
  },

  audioDuration() {
    return this.get('howl').duration() * 1000;
  },

  currentPosition() {
    return this.get('howl').seek() * 1000;
  },

  setPosition(position) {
    this.get('howl').seek(position / 1000);
  },

  setVolume(volume) {
    this.get('howl').volume(volume/100);
  },

  play() {
    this.get('howl').play();
  },

  pause() {
    this.get('howl').pause();
  },

  stop() {
    this.get('howl').stop();
  },

  fastForward(duration) {
    this.get('howl').forward(duration);
  },

  rewind(duration) {
    this.get('howl').rewind(duration);
  }
});
