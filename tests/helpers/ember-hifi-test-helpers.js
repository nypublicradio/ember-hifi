import Ember from 'ember';
import BaseSound from 'ember-hifi/hifi-connections/base';

const {
  get
} = Ember;

const dummyOps = {
  setup() {},
  _audioDuration() {},
  _setVolume() {}
};

function stubConnectionCreateWithSuccess(service, connectionName, test) {
  let Connection =  get(service, `_connections.${connectionName}`);
  test.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = test.stub(Connection, 'create').callsFake(function(options) {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));
    test.stub(sound, 'play').callsFake(() => sound.trigger('audio-played'));
    test.stub(sound, 'pause').callsFake(() => sound.trigger('audio-paused'));
    
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  return connectionSpy;
}

function stubConnectionCreateWithFailure(service, connectionName, test) {
  let Connection =  get(service, `_connections.${connectionName}`);
  test.stub(Connection, 'canPlay').returns(true);

  let connectionSpy = test.stub(Connection, 'create').callsFake(function(options) {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));
    Ember.run.next(() => sound.trigger('audio-load-error'));
    return sound;
  });

  return connectionSpy;
}

export {
  stubConnectionCreateWithSuccess,
  stubConnectionCreateWithFailure,
  dummyOps
};
