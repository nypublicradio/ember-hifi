import Ember from 'ember';
import BaseSound from './base';
import { Howl } from 'howler';

let ClassMethods = Ember.Mixin.create({
  rejectMimeTypes:  ['application/vnd.apple.mpegurl'],

  toString() {
    return 'Howler';
  }
});

let Sound = BaseSound.extend({
  setup() {
    let urls = Ember.makeArray(this.get('url'));
    let sound = this;

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
        sound.trigger('audio-load-error', error);
      },
      onseek: function() {
        sound.trigger('audio-position-changed', sound._currentPosition());
      }
    });
  },

  teardown() {
    let howl = this.get('howl');
    if (howl) {
      howl.unload();
    }
  },

  _audioDuration() {
    return this.get('howl').duration() * 1000;
  },

  _currentPosition() {
    return this.get('howl').seek() * 1000;
  },

  _setPosition(position) {
    this.get('howl').seek(position / 1000);
    return this._currentPosition();
  },

  _setVolume(volume) {
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
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
