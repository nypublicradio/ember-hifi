import Ember from 'ember';
import sinon from 'sinon';
import DummySound from 'dummy/tests/helpers/dummy-sound';

const {
  get
} = Ember;

function stubConnectionCreateWithSuccess(service, connectionName) {
  let Connection =  get(service, `_connections.${connectionName}`);
  sinon.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = sinon.stub(Connection, 'create', function() {
    let sound =  DummySound.create(...arguments);
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
    let sound =  DummySound.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-load-error'));
    return sound;
  });

  return connectionSpy;
}

export {
  stubConnectionCreateWithSuccess,
  stubConnectionCreateWithFailure
};
