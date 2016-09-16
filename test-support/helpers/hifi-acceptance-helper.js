import Ember from 'ember';
import DummyConnection from 'ember-hifi/hifi-connections/dummy-connection';

Ember.Test.onInjectHelpers( function(app) {
  let service = app.__container__.lookup('service:hifi');
  app.register('hifi-connection:local-dummy-connection', DummyConnection, {instantiate: false});
  
  let activeDummy = service._activateConnection({name: 'LocalDummyConnection'});
  service.set('_connections', [activeDummy]);
});
