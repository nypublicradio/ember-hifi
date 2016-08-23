import Ember from 'ember';
import BaseSound from './base';
import soundManager from 'soundManager';

let ClassMethods = Ember.Mixin.create({
  setup() {
    soundManager.setup({
      url: '/assets/swf',
      flashVersion: 9,
      debugMode: false,
    });
  },

  canPlay(url) {
    return soundManager.canPlayURL(url);
  },

  toString() {
    return 'SoundManager2';
  }
});

let Sound = BaseSound.extend({
  init() {
    this._super(...arguments);

    let url = this.get('url');
    let sound = this;

    let soundManagerSound = soundManager.createSound({
      id: url,
      url: url,
      multiShot: false,
      onstop() {
        sound.trigger('audio-stopped', this);
      },
      onfinish() {
        sound.trigger('audio-finished', this);
      },
      onpause() {
        sound.trigger('audio-paused', this);
      },
      onplay() {
        sound.trigger('audio-played', this);
      },
      onresume() {
        sound.trigger('audio-played', this);
      },
      onload: function(success) {
        if (success) {
          sound.set('url', this.url);
          sound.set('soundManagerSound', this);
          sound.trigger('audio-ready', sound);
          sound.trigger('audio-loaded', sound);
        }
        else {
          // Load failed
          sound.trigger('audio-load-error', "load failed");
          this.destruct();
        }
      },
      onfailure() {
        sound.trigger('audio-load-error', "load failed");
        this.destruct();
      },
      whileloading() {
        // sound.trigger('audio-loading', sound);
      },
      ondataerror() {
        sound.trigger('audio-load-error', "data error");
        this.destruct();
      }
    });

    soundManagerSound.load();
  },

  audioDuration() {
    return this.get('soundManagerSound').duration;
  },

  currentPosition() {
    return this.get('soundManagerSound').position;
  },

  setPosition(position) {
    this.get('soundManagerSound').setPosition(position);
  },

  _setVolume(volume) {
    this.get('soundManagerSound').setVolume(volume);
  },

  play() {
    this.get('soundManagerSound').play();
  },

  pause() {
    // TODO: if it's a stream, we might want to stop it
    this.get('soundManagerSound').pause();
  },

  stop() {
    this.get('soundManagerSound').stop();
  },

  fastForward(duration) {
    this.get('soundManagerSound').forward(duration);
  },

  rewind(duration) {
    this.get('soundManagerSound').rewind(duration);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
