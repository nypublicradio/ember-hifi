import Ember from 'ember';
import sinon from 'sinon';
import DummySound from 'dummy/tests/helpers/dummy-sound';

const {
  get
} = Ember;

function stubFactoryCreateWithSuccess(service, factoryName) {
  let Factory =  get(service, `_factories.${factoryName}`);
  sinon.stub(Factory, 'canPlay').returns(true);

  let factorySpy = sinon.stub(Factory, 'create', function() {
    let sound =  DummySound.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  return factorySpy;
}

function stubFactoryCreateWithFailure(service, factoryName) {
  let Factory =  get(service, `_factories.${factoryName}`);
  sinon.stub(Factory, 'canPlay').returns(true);

  let factorySpy = sinon.stub(Factory, 'create', function() {
    console.log(`stubbed ${Factory} create called`);
    let sound =  DummySound.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-load-error'));
    return sound;
  });

  return factorySpy;
}

export {
  stubFactoryCreateWithSuccess,
  stubFactoryCreateWithFailure
};
