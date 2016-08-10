import soundManager from 'soundManager';
import BaseAdapter from './base';
import RSVP from 'rsvp';
import Sound from '../audio-pledge-sounds/sound-manager';

export default BaseAdapter.extend({
  init(config) {
    let adapter = this;

    soundManager.setup({
      url: '/assets/swf',
      flashVersion: 9,
      onready() {
        adapter.set('soundManager', soundManager);
      },

      debugMode:false,

      defaultOptions: {
        multiShot: false,
        onstop() {
          adapter.relayEvent('audio-stopped', this);
        },
        onfinish() {
          adapter.relayEvent('audio-finished', this);
        },
        onpause() {
          adapter.relayEvent('audio-paused', this);
        },
        onplay() {
          adapter.relayEvent('audio-played', this);
        },
        onresume() {
          adapter.relayEvent('audio-resumed', this);
        },
        whileplaying() {
          adapter.relayEvent('audio-position-update', this);
        },
        whileloading() {
          adapter.relayEvent('audio-loading', this);
          if (this.loaded) {
            adapter.relayEvent('audio-loaded');
          }
        }
      }
    });

    this._super(...arguments);
  },

  relayEvent(name, info) {
    let sound = this.get('sound');
    if (sound) {
      sound.trigger(name, info);
    }
  },

  createSound(urls) {
    let urlsToTry = urls.uniq().filter(u => u && u.length > 0);
    let adapter = this;
    let failedUrls = [];

    return new RSVP.Promise((resolve, reject) => {
      (function tryNext(tryLoadingSound) {
        tryLoadingSound
          .then(soundManagerSound => {

            let sound = new Sound();

            adapter.set('sound', sound);
            sound.set('_sound', soundManagerSound);
            sound.set('url', soundManagerSound.url);

            resolve(sound);
          })
          .catch((rejectedUrl) => {
            failedUrls.push(rejectedUrl);
            let url = urlsToTry.shift();
            if (!url) {
              reject(failedUrls);
            }
            else {
              return tryNext(adapter._trySoundUrl(url));
            }
          });
        })(this._trySoundUrl(urlsToTry.shift()));
      });
    },

    _trySoundUrl(url) {
      console.log(`try ${url}`);
      return new RSVP.Promise((resolve, reject) => {
        let soundManager = this.get('soundManager');
        let preload = soundManager.createSound({ id: url, url: url });

        preload.load({
          onload: function(success) {
            if (success) {
              resolve(preload);
            }
            else {
              // Load failed
              preload.destruct();
              reject(url);
            }
          }
        });

      });
    }



});
