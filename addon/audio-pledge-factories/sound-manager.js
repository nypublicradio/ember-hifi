import Ember from 'ember';
import BaseSound from './base';
import RSVP from 'rsvp';
import PromiseTry from '../utils/promise-try';
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
    let urls = this.get('urls');
    let urlsToTry = urls.uniq().filter(u => u && u.length > 0);
    let sound = this;
    let create =  PromiseTry.findFirst(urlsToTry, (param) => {
      return new RSVP.Promise((resolve, reject) => {
          let soundManagerSound = soundManager.createSound({
            id: param,
            url: param,
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
              sound.trigger('audio-resumed', this);
            },
            onload: function(success) {
              if (success) {
                let workingIndex = urlsToTry.indexOf(this.url);
                let failedUrls   = urlsToTry.slice(0, workingIndex);
                sound.set('failedUrls', failedUrls);
                sound.set('url', this.url);
                sound.set('soundManagerSound', this);
                resolve(sound);
              }
              else {
                // Load failed
                soundManagerSound.destruct();
                reject(param);
              }
            },
            whileplaying() {
              sound.trigger('audio-position-update', this);
            },
            whileloading() {
              sound.trigger('audio-loading', this);
              if (this.loaded) {
                sound.trigger('audio-loaded');
              }
            }
          });

          soundManagerSound.load();
      });
    });

    create.then(s => {
      this.trigger('audio-ready', s);
    }).catch(s => {
      this.trigger('audio-load-error', s);
    });

    this.setupEvents();
  },

  setupEvents() {
    this.on('audio-played',    () => this.set('isPlaying', true));
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-resumed',   () => this.set('isPlaying', true));
    this.on('audio-stopped',   () => this.set('isPlaying', false));
    this.on('audio-loaded',    () => {
      this.set('duration', this.get('soundManagerSound').duration);
      this.set('isLoading', false);
    });
    this.on('audio-loading',   () => this.set('isLoading', true));
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

  forward(duration) {
    this.get('soundManagerSound').forward(duration);
  },

  rewind(duration) {
    this.get('soundManagerSound').rewind(duration);
  },

  setPosition(position) {
    this.get('soundManagerSound').setPosition(position);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
