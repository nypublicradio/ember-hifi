import { next } from '@ember/runloop';
import { get } from '@ember/object';
import BaseSound from 'ember-hifi/hifi-connections/base';
import sinon from 'sinon';

const dummyOps = {
  setup() {},
  _audioDuration() {},
  _setVolume() {}
};

function stubConnectionCreateWithSuccess(service, connectionName, sandbox = sinon) {
  let Connection =  get(service, `_connections.${connectionName}`);
  sandbox.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = sandbox.stub(Connection, 'create').callsFake(function(options) {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));
    sandbox.stub(sound, 'play').callsFake(() => sound.trigger('audio-played'));
    sandbox.stub(sound, 'pause').callsFake(() => sound.trigger('audio-paused'));

    next(() => sound.trigger('audio-ready'));
    return sound;
  });

  return connectionSpy;
}

function stubConnectionCreateWithFailure(service, connectionName, sandbox = sinon) {
  let Connection =  get(service, `_connections.${connectionName}`);
  sandbox.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = sandbox.stub(Connection, 'create').callsFake(function(options) {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));
    next(() => sound.trigger('audio-load-error'));
    return sound;
  });

  return connectionSpy;
}

export {
  stubConnectionCreateWithSuccess,
  stubConnectionCreateWithFailure,
  dummyOps
};
