import Ember from 'ember';
const {
  assert
} = Ember;

export default Ember.Object.extend(Ember.Evented, {
  init() {    
    this.on('audio-played',    () => this.set('isPlaying', true));
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-resumed',   () => this.set('isPlaying', true));
    this.on('audio-stopped',   () => this.set('isPlaying', false));
    this.on('audio-loaded',    () => {
      this.set('isLoading', false);
    });
    this.on('audio-loading',   () => this.set('isLoading', true));

    this._super(...arguments);
  },

  play() {
    this.get('_sound').play();
  },

  pause() {
    this.get('_sound').pause();
  },

  stop() {
    this.get('_sound').stop();
  },

  forward() {
    assert("[audio-pledge] interface not implemented", false);
  },

  rewind() {
    assert("[audio-pledge] interface not implemented", false);
  },

  setPosition(position) {
    this.get('_sound').seek(position);
  }
});
