import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import sinon from 'sinon';
const { get, set, K } = Ember;

let sandbox, audioPledgeFactories, options;

moduleFor('service:audio-pledge', 'Unit | Service | audio pledge', {
  // Specify the other units that are required for this test.

  needs: [
    'service:debug-logger',
    'audio-pledge@audio-pledge-factory:howler',
    'audio-pledge@audio-pledge-factory:native-audio',
    'audio-pledge-factory:local-dummy-factory'
  ],
  beforeEach() {
    sandbox = sinon.sandbox.create();

    // All audio pledge factories. Use chooseActiveFactories to set order and activation
    audioPledgeFactories = [
      {
        name: 'Howler',
        config: {
          testOption: 'Howler'
        }
      },
      {
        name: 'NativeAudio',
        config: {
          testOption: 'NativeAudio'
        }
      },
      {
        name: 'LocalDummyFactory',
        config: {
          testOption: 'LocalDummyFactory'
        }
      },
    ];

    options = {
      audioPledgeFactories
    };
  },

  afterEach() {
    sandbox.restore();
  }
});

const DummySound = Ember.Object.extend(Ember.Evented, {
  play() {}
});

function chooseActiveFactories(...factoriesToActivate) {
  let factories = [];
  Ember.A(factoriesToActivate).forEach(name => {
    let found = audioPledgeFactories.find(f => (f.name === name));
    if (found) {
      factories.push(found);
    }
  });

  return {
    audioPledgeFactories: factories
  };
}

test('it activates local factories', function(assert) {
  options.config = {'foo': 'bar'};
  const service = this.subject({ options: chooseActiveFactories('LocalDummyFactory') });

  assert.ok(get(service, '_factories.LocalDummyFactory'), 'it activated the LocalDummyFactory');
  assert.equal(get(service, '_factories.LocalDummyFactory.config.testOption'), 'LocalDummyFactory', 'it passes config options to the LocalDummyFactory');
});

test('#activateFactories activates an array of factories', function(assert) {
  const service = this.subject({ options });

  audioPledgeFactories.forEach(factory => {
    assert.ok(get(service, `_factories.${factory.name}`), `it activated the ${factory.name} factory`);
    assert.equal(get(service, `_factories.${factory.name}.config.testOption`), factory.name, `it passes config options to the ${factory} factory`);
  });
});

test('#load tries the first factory that says it can handle the url', function(assert) {
  const service = this.subject({ options });

  let done = assert.async();
  let testUrl = "/test/not-a-sound.mp3";

  let Howler            =  get(service, `_factories.Howler`);
  let NativeAudio       =  get(service, `_factories.NativeAudio`);
  let LocalDummyFactory =  get(service, `_factories.LocalDummyFactory`);

  let howlerSpy         = sinon.stub(Howler, 'canPlay').returns(false);
  let nativeSpy         = sinon.stub(NativeAudio, 'canPlay').returns(true);
  let localSpy          = sinon.stub(LocalDummyFactory, 'canPlay').returns(false);

  let sound             = new DummySound();

  let nativeCreateSpy   = sinon.stub(NativeAudio, 'create').returns(sound);
  let howlerCreateSpy   = sinon.stub(Howler, 'create').returns(sinon.createStubInstance(Howler));
  let localCreateSpy    = sinon.stub(LocalDummyFactory, 'create').returns(sinon.createStubInstance(LocalDummyFactory));

  let promise = service.load(testUrl);
  promise.then(() => {
    done();
  });

  sound.trigger('audio-ready');

  assert.ok(howlerSpy.calledOnce, "howler canPlay should have been called");
  assert.ok(nativeSpy.calledOnce, "nativeSpy canPlay should have been called");
  assert.ok(localSpy.calledOnce, "local canPlay should not have been called");

  assert.equal(howlerCreateSpy.callCount, 0, "Howler factory should not have been used");
  assert.ok(nativeCreateSpy.calledWith({url: testUrl}), "Native factory should have been used");
  assert.equal(localCreateSpy.callCount, 0, "Local factory should not have been used");
});

test('#load stops trying urls after a sound loads and reports accurately', function(assert) {
  const service = this.subject({ options: chooseActiveFactories('LocalDummyFactory') });

  let done = assert.async();

  let badUrl1 = "/test/test-1.mp3";
  let badUrl2 = "/test/test-2.mp3";
  let goodUrl = "/test/test-3.mp3";
  let unusedUrl = "/test/test-4.mp3";
  let error1 = 'unknown error';
  let error2 = 'codec not supported';
  let expectedUrl;
  let expectedFailures;

  let LocalDummyFactory =  get(service, `_factories.LocalDummyFactory`);
  sinon.stub(LocalDummyFactory, 'canPlay').returns(true);

  let localCreateSpy    = sinon.stub(LocalDummyFactory, 'create', function() {
    let sound =  DummySound.create(...arguments);

    if (sound.get('url') === goodUrl) {
      Ember.run.next(() => sound.trigger('audio-ready'));
    }
    else if (sound.get('url') === badUrl2) {
      Ember.run.next(() => sound.trigger('audio-load-error', error2));
    }
    else if (sound.get('url') === badUrl1) {
      Ember.run.next(() => sound.trigger('audio-load-error', error1));
    }

    return sound;
  });

  service.load([badUrl1, badUrl2, goodUrl, unusedUrl]).then(({sound, failures}) => {
    expectedUrl = sound.get('url');
    expectedFailures = failures;
    done();
  });

  return wait().then(() => {
    assert.equal(localCreateSpy.callCount, 3, "create should only be called three times");
    assert.equal(expectedUrl, goodUrl, "sound returned should have the successful url");
    assert.equal(Ember.A(expectedFailures).mapBy('url').length, 2, "should only have two failures");
    assert.equal(expectedFailures[0].error, error1, `first url should have error: ${error1}`);
    assert.equal(expectedFailures[1].error, error2, `second url should have error: ${error2}`);
    assert.equal(expectedFailures[0].url, badUrl1, `first bad url should be: ${badUrl1}`);
    assert.equal(expectedFailures[1].url, badUrl2, `second bad url should be: ${badUrl2}`);
  });
});

test('When a sound gets created it gets registered with OneAtATime', function(assert) {
  let done = assert.async();
  assert.expect(1);
  const service = this.subject({ options: chooseActiveFactories('LocalDummyFactory') });

  let LocalDummyFactory =  get(service, `_factories.LocalDummyFactory`);

  sinon.stub(LocalDummyFactory, 'create', function() {
    let sound =  DummySound.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  let url = "/test/test.mp3";

  service.load(url).then(({sound}) => {
    assert.deepEqual(service.get('oneAtATime.sounds.firstObject'), sound, "sound should be registered with one at a time");
    done();
  });
});

test('The second time a url is requested it will be pulled from the cache', function(assert) {
  let done = assert.async();
  assert.expect(6);
  const service = this.subject({ options: chooseActiveFactories('LocalDummyFactory') });

  let LocalDummyFactory =  get(service, `_factories.LocalDummyFactory`);

  let localFactorySpy = sinon.stub(LocalDummyFactory, 'create', function() {
    let sound =  DummySound.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  let url = "/test/test.mp3";

  let soundCache = service.get('soundCache');

  let findSpy = sinon.spy(soundCache, 'find');
  let cacheSpy = sinon.spy(soundCache, 'cache');

  service.load(url).then(({sound}) => {
    assert.equal(findSpy.callCount, 1, "cache should have been checked");
    assert.equal(cacheSpy.callCount, 1, "sound should be registered with sound cache");
    sound.set('identification', 'yo');

    service.load(url).then(({sound}) => {
      assert.equal(sound.get('identification'), 'yo', "should be the same sound in sound cache");

      assert.equal(localFactorySpy.callCount, 1, "factory should not have been called again");
      assert.equal(findSpy.callCount, 2, "cache should have been checked");
      assert.equal(localFactorySpy.callCount, 1, "factory should not have been called again");
      done();
    });
  });
});
