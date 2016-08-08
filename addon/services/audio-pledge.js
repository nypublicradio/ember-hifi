import Ember from 'ember';
import { Howl } from 'howler';

export default Ember.Service.extend(Ember.Evented, {
  currentSound: null,

  init() {
    this.on('audio-played',    () => this.set('isPlaying', true));
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-resumed',   () => this.set('isPlaying', true));
    this.on('audio-stopped',   () => this.set('isPlaying', false));
    this.on('audio-loaded',    () => {
      this.set('isLoading', false);
    });
    this.on('audio-loading',   () => this.set('isLoading', true));

    this.set('cachedSounds', new Ember.Map());
  },

  play(urls, soundId) {
    this.pause();

    return this._findOrCreateSound(soundId, urls).then(results => {
      let sound = results.sound;
      this.pause(); // make sure it's paused

      this.set('currentSound', sound);
      this._cacheSound(sound);

      sound.play();

      return results;
    }).catch(results => {

      return results;
    });
  },

  pause() {
    let sound = this.get('currentSound');
    if (sound) {
      sound.pause();
    }
  },

  togglePause() {
    let sound = this.get('currentSound');
    sound[this.get('isPlaying') ? 'pause' : 'play']();
  },

  _findOrCreateSound(id, urls) {
    let service = this;
    let status = this._audioLoadStatus;
    let urlsToTry =  urls.uniq().filter(u => u && u.length > 0);

    return new Ember.RSVP.Promise((resolve, reject) => {
      let sound = this._findCachedSound(urlsToTry);

      if (sound) {
        resolve(status(sound, urlsToTry));
      }
      else {
        sound = new Howl({
          src:      urlsToTry,
          volume:   1,
          autoplay: false,
          preload:  true,
          html5:    true,
          onload: function() {
            service.trigger('audio-loaded', this);
            resolve(status(this, urlsToTry));
          },
          onpause: function() {
            service.trigger('audio-paused', this);
          },
          onplay: function() {
            service.trigger('audio-played', this);
          },
          onend: function() {
            service.trigger('audio-ended', this);
          },
          onloaderror: function(id, error) {
            reject(status(sound, urlsToTry, error));
          }
        });

      }
    });
  },

  _findCachedSound(urls) {
    let sound;
    urls.forEach(url => {
      if (!sound) {
        sound = this.get('cachedSounds').get(url);
      }
    });
    if (sound) {
      console.log("found sound");
    }

    return sound;
  },

  _cacheSound(sound) {
    if (sound._url) {
      this.get('cachedSounds').set(sound._url, sound);
    }
  },

  _audioLoadStatus(sound, urls, error) {
    // Howler tries these the order that are given. The ones before this failed
    let workingIndex = urls.indexOf(sound._src);
    let failedUrls   = urls.slice(0, workingIndex);

    console.log(error);
    let url = sound._src;

    return {sound: sound, failedUrls: failedUrls, url: url, error: error};
  }
});
