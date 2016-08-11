import BaseAdapter from './base';
import { Howl } from 'howler';
import RSVP from 'rsvp';
import Sound from '../audio-pledge-sounds/howler';

export default BaseAdapter.extend({
  createSound(urls) {
    return new RSVP.Promise((resolve, reject) => {
      let sound = new Sound();
      new Howl({
        src:      urls,
        volume:   1,
        autoplay: false,
        preload:  true,
        html5:    true,
        onload: function() {
          sound.set('url', this._src);
          sound.set('_sound', this);
          resolve(sound);
          sound.trigger('audio-loaded', sound);
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
          reject(error);
          sound.trigger('audio-load-error', sound);
        }
      });
    });
  }
});
