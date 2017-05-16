import Ember from 'ember';

export default Ember.Service.extend({
  hifi: Ember.inject.service(),

  playGood() {
    return this.get('hifi').play('/good/1252/ok.mp3');
  },

  playBad() {
    return this.get('hifi').play('/bad/1252/ok.mp3');
  },

  playBlank() {
    return this.get('hifi').play();
  }
});
