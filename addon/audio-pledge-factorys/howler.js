import BaseSound from './base';
import { Howl } from 'howler';

export default BaseSound.extend({
  init() {
    let urls = this.get('urls');
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

        let workingIndex = urls.indexOf(this._src);
        let failedUrls   = urls.slice(0, workingIndex);
        sound.set('failedUrls', failedUrls);

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

    this.setupEvents();
  },

  setupEvents() {
    this.on('audio-played',    () => this.set('isPlaying', true));
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-resumed',   () => this.set('isPlaying', true));
    this.on('audio-stopped',   () => this.set('isPlaying', false));

    this.on('audio-loaded',    () => {
      this.set('isLoading', false);
      this.set('duration', this.get('howl').duration());
    });

    this.on('audio-loading',   () => {
      this.set('isLoading', true);
    });

    this.on('audio-load-error',   () => {
      this.set('isLoading', false);
    });
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
  },

  setPosition(position) {
    this.get('howl').setPosition(position);
  }
});
