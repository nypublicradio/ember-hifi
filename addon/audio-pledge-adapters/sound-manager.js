import soundManager from 'soundManager';
import BaseAdapter from './base';
import RSVP from 'rsvp';

export default BaseAdapter.extend({
  init(/* config */) {

    soundManager.setup({
      url: '/assets/swf',
      flashVersion: 9,
      onready: () => this.set('soundManager', soundManager),
      debugMode: false,
    });

    this._super(...arguments);
  },

  createSound(urls) {
    let urlsToTry = urls.uniq().filter(u => u && u.length > 0);
    let adapter = this;
    let failedUrls = [];

    return new RSVP.Promise((resolve, reject) => {
      (function tryNext(tryLoadingSound) {
        tryLoadingSound
          .then(resolve)
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
        let soundObject = { adapter: this, url };

        soundObject.sound = soundManager.createSound({
          id: url,
          url: url,
          multiShot: false,
          onstop: () => this.trigger('audio-stopped', soundObject),
          onfinish: () => this.trigger('audio-finished', soundObject),
          onpause: () => this.trigger('audio-paused', soundObject),
          onplay: () => this.trigger('audio-played', soundObject),
          onresume: () => this.trigger('audio-resumed', soundObject),
          onload: (success) => {
            if (success) {
              this.set('url', soundObject.sound.url);
              this.set('_sound', soundObject);
              resolve(soundObject);
            }
            else {
              // Load failed
              soundObject.sound.destruct();
              reject(url);
            }
          },
          whileplaying: () => this.trigger('audio-position-update', this),
          whileloading: () => {
            this.trigger('audio-loading', this);
            if (soundObject.sound.loaded) {
              this.trigger('audio-loaded', soundObject);
            }
          }
        });

        soundObject.sound.load();
      });
    }



});
