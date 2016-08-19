import Ember from 'ember';
import BaseSound from './base';
import soundManager from 'soundManager';

const ClassMethods = Ember.Mixin.create({
  setup() {
    soundManager.setup({
      url: '/assets/swf',
      flashVersion: 9,
      debugMode: false,
    });
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
        }
        else {
          // Load failed
          soundManagerSound.destruct();
          sound.trigger('audio-load-error', sound);
        }
      },
      whileloading() {
        sound.trigger('audio-loading', this);
        if (this.loaded) {
          sound.trigger('audio-loaded');
        }
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

  play() {
    this.get('soundManagerSound').play();
  },

  pause() {
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
