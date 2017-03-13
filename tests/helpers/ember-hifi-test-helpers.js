import Ember from 'ember';
import DummyConnection from 'dummy/hifi-connections/local-dummy-connection';

const {
  get
} = Ember;

function stubConnectionCreateWithSuccess(service, connectionName, test) {
  let Connection =  get(service, `_connections.${connectionName}`);
  test.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = test.stub(Connection, 'create', function(options) {
    let sound =  DummyConnection.create(...arguments);
    test.stub(sound, 'play', () => sound.trigger('audio-played'));
    test.stub(sound, 'pause', () => sound.trigger('audio-paused'));
    
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  return connectionSpy;
}

function stubConnectionCreateWithFailure(service, connectionName, test) {
  let Connection =  get(service, `_connections.${connectionName}`);
  test.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = test.stub(Connection, 'create', function(options) {
    console.log(`stubbed ${Connection} create called`);
    let sound =  DummyConnection.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-load-error'));
    return sound;
  });

  return connectionSpy;
}

export {
  stubConnectionCreateWithSuccess,
  stubConnectionCreateWithFailure
};
