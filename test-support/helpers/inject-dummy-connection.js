import Ember from 'ember';
import DummySound from 'audio-pledge/audio-pledge-factories/dummy-sound';

export default Ember.Test.registerHelper('injectDummySound', function(app) {
  let service = app.__container__.lookup('service:audio-pledge');
  app.register('audio-pledge-factory:local-dummy-factory', DummySound, {instantiate: false});
  
  service._activateFactories([{name: 'LocalDummyFactory'}]);
});
