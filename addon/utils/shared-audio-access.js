import Ember from 'ember';
import DebugLogging from '../mixins/debug-logging';

const SharedAudioAccess = Ember.Object.extend(DebugLogging, {
  debugName: 'sharedAudioAccess',

  unlock(andPlay) {
    let audioElement = this.get('audioElement');
    if (!audioElement) {
      this.debug('creating new audio element');
      audioElement = this._createElement();
      this.set('audioElement', audioElement);

      if (andPlay) {
        this.debug(`telling blank audio element to play`);
        audioElement.play();
      }
    }
    return this;
  },

  requestControl(who) {
    let owner = this.get('owner');

    if ((owner !== who) && owner) {
      who.debug("I need audio control");
      this.debug("coordinating peaceful transfer of power");
    }

    if (owner) {
      if ( !(owner.get('isDestroyed') || owner.get('isDestroying')) ) {
        owner.releaseControl();
        if ((owner !== who) && owner) {
          owner.debug("I've released audio control");
        }
      }
    }

    this.set('owner', who);
    if (owner !== who) {
      who.debug("I have control now");
    }
    return this.get('audioElement');
  },

  hasControl(who) {
    return (this.get('owner') === who);
  },

  releaseControl(who) {
    if (this.hasControl(who)) {
      this.set('owner', null);
    }
  },

  _createElement() {
    return document.createElement('audio');
  },

  _reset() {
    this.set('owner', null);
    this.set('audioElement', null);
  }
});

export default SharedAudioAccess.create();
