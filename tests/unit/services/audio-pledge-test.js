import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
const { get } = Ember;

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
  play() {},
  currentPosition() {},
  _setVolume(v) {
    console.log(`setting volume to ${v}`);
    this.set('volume', v);
  }
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
  }).finally(() => {
    assert.equal(localCreateSpy.callCount, 3, "create should only be called three times");
    assert.equal(expectedUrl, goodUrl, "sound returned should have the successful url");
    assert.equal(Ember.A(expectedFailures).mapBy('url').length, 2, "should only have two failures");
    assert.equal(expectedFailures[0].error, error1, `first url should have error: ${error1}`);
    assert.equal(expectedFailures[1].error, error2, `second url should have error: ${error2}`);
    assert.equal(expectedFailures[0].url, badUrl1, `first bad url should be: ${badUrl1}`);
    assert.equal(expectedFailures[1].url, badUrl2, `second bad url should be: ${badUrl2}`);
    done();
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
  assert.expect(5);
  const service = this.subject({ options: chooseActiveFactories('LocalDummyFactory') });
  let LocalDummyFactory =  get(service, `_factories.LocalDummyFactory`);

  let localFactorySpy = sinon.stub(LocalDummyFactory, 'create', function() {
    let sound =  DummySound.create(...arguments);
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  let url = "/test/test.mp3";

  let soundCache = service.get('soundCache');
  service.get('soundCache').reset(); // make sure it's at zero

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
      done();
    });
  });
});

test('position gets polled regularly on the currentSound but not on the others', function(assert) {
  this.clock = sinon.useFakeTimers();

  const service = this.subject({ options });

  const INTERVAL = 500;

  let sound1 = new DummySound({});
  let sound2 = new DummySound({});

  let spy1 = sinon.spy(sound1, 'currentPosition');
  let spy2 = sinon.spy(sound2, 'currentPosition');

  assert.equal(spy1.callCount, 0, "sound 1 should not have been polled yet");
  assert.equal(spy2.callCount, 0, "sound 1 should not have been polled yet");
  service.set('pollInterval', INTERVAL);
  service.setCurrentSound(sound1);

  this.clock.tick(INTERVAL * 4);

  assert.equal(spy1.callCount, 4, "sound 1 should have been polled 4 times");
  assert.equal(spy2.callCount, 0, "sound 2 should not have been polled yet");
  service.setCurrentSound(sound2);

  this.clock.tick(INTERVAL * 2);

  assert.equal(spy1.callCount, 4, "sound 1 should not have been polled again");
  assert.equal(spy2.callCount, 2, "sound 2 should have been polled twice");

  this.clock.restore();
});

test('volume changes are set on the current sound', function(assert) {
  const service = this.subject({ options });

  let sound1 = new DummySound({});
  let sound2 = new DummySound({});

  let spy1 = sinon.spy(sound1, '_setVolume');
  let spy2 = sinon.spy(sound2, '_setVolume');

  let defaultVolume = service.get('defaultVolume');

  assert.equal(service.get('volume'), service.get('defaultVolume'), "service should have default volume");

  assert.equal(spy1.callCount, 0, "volume should not be set");

  service.setCurrentSound(sound1);

  assert.ok(spy1.withArgs(defaultVolume).calledOnce, "volume on sound 1 should be set to default volume");

  service.setCurrentSound(sound2);

  assert.ok(spy2.withArgs(defaultVolume).calledOnce, "volume on sound 2 should be set to default volume after current sound change");

  service.set('volume', 55);

  assert.ok(spy2.withArgs(55).calledOnce, "volume on sound 2 should be set to new system volume");

  service.setCurrentSound(sound1);

  assert.ok(spy1.withArgs(55).calledOnce, "volume on sound 1 should be set to new system volume after current sound change");

  sound1._setVolume(0);
  assert.equal(service.get('volume'), 55, "setting sound volume individually should have no effect on system volume. Relationship is one way.");
});
