import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['ondemand-display'],
  hifi: Ember.inject.service(),

  didReceiveAttrs() {
    // this.preload();
  },

  preload() {
    let url = this.get('story.audioUrl');
    this.set('url', url);
    this.get('hifi').load(url).then(({ sound }) => {
      this.set('sound', sound);
    }).catch(({failedUrls, results}) => {
      console.dir(results);
    });
  },

  actions: {
    play(item) {
      this.get('hifi').play(item.get('audioUrl'));
    }
  }
});
