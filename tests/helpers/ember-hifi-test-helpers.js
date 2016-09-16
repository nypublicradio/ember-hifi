import Ember from 'ember';
import sinon from 'sinon';
import DummyConnection from 'dummy/hifi-connections/local-dummy-connection';

const {
  get
} = Ember;

function stubConnectionCreateWithSuccess(service, connectionName) {
  let Connection =  get(service, `_connections.${connectionName}`);
  sinon.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = sinon.stub(Connection, 'create', function() {
    let sound =  DummyConnection.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  return connectionSpy;
}

function stubConnectionCreateWithFailure(service, connectionName) {
  let Connection =  get(service, `_connections.${connectionName}`);
  sinon.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = sinon.stub(Connection, 'create', function() {
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
