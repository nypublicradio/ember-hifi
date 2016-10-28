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
  requestAccess(who) {
    // return shared audio element
    // save who has access 
    this.set('owner', who);
    return this.get('audioElement');
  },
  hasAccess(who) {
    return (!this.get('owner') || this.get('owner') === who);
  },
  releaseAccess(who) {
    if (this.hasAccess(who)) {
      this.set('owner', null);
    }
  }
});
