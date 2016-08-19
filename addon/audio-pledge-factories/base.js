import Ember from 'ember';

const {
  assert,
  observer,
  get,
  set
} = Ember;

let ClassMethods = Ember.Mixin.create({
  setup() {
  }
});

let Sound = Ember.Object.extend(Ember.Evented, {
  isPlaying:    false,
  isLoading:    false,
  pollInterval: 1000,
  position:     0,
  duration:     0,

  init: function() {
    this.on('audio-played',    () => {
      this.set('isLoading', false);
      this.set('isPlaying', true);
    });
    this.on('audio-paused',    () => this.set('isPlaying', false));
    this.on('audio-stopped',   () => this.set('isPlaying', false));
    this.on('audio-ready',    () => {
      this.set('duration', this.audioDuration());
    });
    this.on('audio-loaded', () => {
      this.set('isLoading', false);
    });
    this.on('audio-loading',   () => this.set('isLoading', true));
  },

  __updateAndPollPlayPosition: observer('isPlaying', 'isLoaded', function() {
     if (get(this, 'isPlaying')) {
       this.__setCurrentPosition();
       Ember.run.later(() =>  this.__updateAndPollPlayPosition(), get(this, 'pollInterval'));
     }
  }),

  __setCurrentPosition() {
    // currentPosition is defined on the subclass
    set(this, 'position', this.currentPosition());
  },


  /* To be defined on the subclass */


  currentPosition() {
    assert("[audio-pledge] #currentPosition interface not implemented", false);
  },

  setPosition() {
    assert("[audio-pledge] #setPosition interface not implemented", false);
  },

  play() {
    assert("[audio-pledge] #play interface not implemented", false);
  },

  pause() {
    assert("[audio-pledge] #pause interface not implemented", false);
  },

  stop() {
    assert("[audio-pledge] #stop interface not implemented", false);
  },

  forward() {
    assert("[audio-pledge] #forward interface not implemented", false);
  },

  rewind() {
    assert("[audio-pledge] #rewind interface not implemented", false);
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
