import soundManager from 'soundManager';
import BaseAdapter from './base';
import RSVP from 'rsvp';
import Sound from '../audio-pledge-sounds/sound-manager';
import PromiseTry from '../utils/promise-try';
export default BaseAdapter.extend({
  init(config) {
    let adapter = this;

    soundManager.setup({
      url: '/assets/swf',
      flashVersion: 9,
      onready() {
        adapter.set('soundManager', soundManager);
      },
      debugMode: false,
    });

    this._super(...arguments);
  },

  createSound(urls) {
    let urlsToTry = urls.uniq().filter(u => u && u.length > 0);

    return PromiseTry.findFirst(urlsToTry, (param) => {
      return new RSVP.Promise((resolve, reject) => {
          let soundManager = this.get('soundManager');
          let sound = new Sound();
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
                sound.set('url', this.url);
                sound.set('_sound', this);
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
  }
});
