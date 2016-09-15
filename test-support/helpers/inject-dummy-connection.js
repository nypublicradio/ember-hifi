import Ember from 'ember';
import DummySound from 'ember-hifi/hifi-connections/dummy-sound';

export default Ember.Test.registerHelper('injectDummySound', function(app) {
  let service = app.__container__.lookup('service:audio-pledge');
  app.register('hifi-connection:local-dummy-connection', DummySound, {instantiate: false});
  
  service._activateFactories([{name: 'LocalDummyConnection'}]);
});
