import Ember from 'ember';

export default Ember.Object.create({
  unlock() {
    let audioElement = this.get('audioElement');
    if (!audioElement) {
      audioElement = document.createElement('audio');
      this.set('audioElement', audioElement);
      audioElement.play();
    }

    return this;
  },

  requestControl(who) {
    this.set('owner', who);

    return this.get('audioElement');
  },

  hasControl(who) {
    return (this.get('owner') === who);
  },

  releaseControl(who) {
    if (this.hasControl(who)) {
      this.set('owner', null);
    }
  }
});
