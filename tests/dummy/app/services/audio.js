import Service, { inject as service } from '@ember/service';

export default Service.extend({
  hifi: service(),

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
