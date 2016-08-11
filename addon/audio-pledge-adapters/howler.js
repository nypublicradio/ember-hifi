import BaseAdapter from './base';
import { Howl } from 'howler';
import RSVP from 'rsvp';

export default BaseAdapter.extend({
  init(config) {
    this._super(...arguments);
  },

  createSound(urls) {
    return new RSVP.Promise((resolve, reject) => {  

      let soundObject = { adapter: this };
      soundObject.sound = new Howl({
         src:      urls,
         volume:   1,
         autoplay: false,
         preload:  true,
         html5:    true,
         onload: () => {
           soundObject.url = this._src;
           this.set('_sound', this);
           resolve(soundObject.sound);
           this.trigger('audio-loaded', soundObject);
         },
         onpause: () => this.trigger('audio-paused', soundObject),
         onplay: () => this.trigger('audio-played', soundObject),
         onend: () => this.trigger('audio-ended', soundObject),
         onloaderror: (id, error) => {
           reject(error);
           this.trigger('audio-load-error', soundObject);
         }
       });
      
    });
  }
});
