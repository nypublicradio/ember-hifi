import Ember from 'ember';
import DebugLogging from 'ember-hifi/mixins/debug-logging';

let ClassMethods = Ember.Mixin.create({
  setup() {},
  canPlay: () => true,
  canUseConnection: () => true,
  canPlayMimeType: () => true,
});

let DummyConnection = Ember.Object.extend(Ember.Evented, DebugLogging, {
  debugName: 'dummyConnection',
  position: 0,
  duration: 10000,
  
  init() {
    this.on('audio-played',    () => {
      this.set('hasPlayed', true);
      this.set('isLoading', false);
      this.set('isPlaying', true);
      this.set('error', null);
      
      // recover lost isLoading update
      this.notifyPropertyChange('isLoading');
    });

    this.on('audio-paused',   () => {
      this.set('isPlaying', false);
    });
    this.on('audio-ended',    () => { 
      this.set('isPlaying', false);
    });
    
    this.on('audio-load-error', (e) => {
      if (this.get('hasPlayed')) {
        this.set('isLoading', false);
        this.set('isPlaying', false);
      }
      this.set('error', e);
    });

    this.on('audio-loaded', () => {
      this.set('isLoading', false);
    });
    
    Ember.run.next(() => this.trigger('audio-ready'));
  },
  play({position} = {}) {
    if (typeof position !== 'undefined') {
      this.set('position', position);
    }
    this.trigger('audio-played', this);
  },
  pause() {
    this.trigger('audio-paused');
  },
  stop() {
    this.trigger('audio-paused');
  },
  fastForward(duration) {
    this.set('position', this.get('position') + duration);
  },
  rewind(duration) {
    this.set('position', this.get('position') - duration);
  },
  _setPosition() {},
  _currentPosition() {},
  _setVolume(v) {
    this.set('volume', v);
  },
  _audioDuration() {},
});

DummyConnection.reopenClass(ClassMethods);

export default DummyConnection;
