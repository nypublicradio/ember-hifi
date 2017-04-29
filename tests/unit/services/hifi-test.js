import Ember from 'ember';
import { moduleFor } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import sinon from 'sinon';
const { get, set } = Ember;
import LocalDummyConnection from 'dummy/hifi-connections/local-dummy-connection';
import DummyConnection from 'ember-hifi/hifi-connections/dummy-connection';
import BaseSound from 'ember-hifi/hifi-connections/base';
import { dummyOps, stubConnectionCreateWithSuccess, stubConnectionCreateWithFailure } from '../../helpers/ember-hifi-test-helpers';

let hifiConnections, options;

moduleFor('service:hifi', 'Unit | Service | hifi', {
  // Specify the other units that are required for this test.

  needs: [
    'service:poll',
    'service:hifi-cache',
    'ember-hifi@hifi-connection:howler',
    'ember-hifi@hifi-connection:native-audio',
    'hifi-connection:local-dummy-connection'
  ],
  beforeEach() {
    // All hifi connections. Use chooseActiveConnections to set order and activation
    hifiConnections = [
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
        name: 'LocalDummyConnection',
        config: {
          testOption: 'LocalDummyConnection'
        }
      },
    ];

    options = {
      emberHifi: {
        debug: false,
        connections: hifiConnections
      }
    };

    const soundCacheStub = Ember.Service.extend({
      find() {
        return false;
      },
      cache() {

      },
      reset() {

      }
    });

    this.register('service:hifi-cache', soundCacheStub);
    this.inject.service('hifi-cache', { as: 'soundCache' });
  }
});

function chooseActiveConnections(...connectionsToActivate) {
  let connections = [];
  Ember.A(connectionsToActivate).forEach(name => {
    let found = hifiConnections.find(f => (f.name === name));
    if (found) {
      connections.push(found);
    }
  });

  return {
    emberHifi: {
      debug: false,
      connections: connections
    }
  };
}

test('it activates local connections', function(assert) {
  options.config = {'foo': 'bar'};
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });

  assert.ok(get(service, '_connections.LocalDummyConnection'), 'it activated the LocalDummyConnection');
  assert.equal(get(service, '_connections.LocalDummyConnection.config.testOption'), 'LocalDummyConnection', 'it passes config options to the LocalDummyConnection');
});

test('#activateConnections activates an array of connections', function(assert) {
  const service = this.subject({ options });

  hifiConnections.forEach(connection => {
    assert.ok(get(service, `_connections.${connection.name}`), `it activated the ${connection.name} connection`);
    assert.equal(get(service, `_connections.${connection.name}.config.testOption`), connection.name, `it passes config options to the ${connection} connection`);
  });
});

test('it returns a list of the available connections', function(assert) {
  const service = this.subject({ options });
  assert.deepEqual(service.availableConnections(), ["Howler", "NativeAudio", "LocalDummyConnection"]);
});

test('#load tries the first connection that says it can handle the url', function(assert) {
  const service = this.subject({ options });

  let done = assert.async();
  let testUrl = "/test/not-a-sound.mp3";

  let Howler            =  get(service, `_connections.Howler`);
  let NativeAudio       =  get(service, `_connections.NativeAudio`);
  let LocalDummyConnection =  get(service, `_connections.LocalDummyConnection`);

  let howlerSpy         = this.stub(Howler, 'canPlay').returns(false);
  let nativeSpy         = this.stub(NativeAudio, 'canPlay').returns(true);
  let localSpy          = this.stub(LocalDummyConnection, 'canPlay').returns(false);

  let sound             = LocalDummyConnection.create();

  let nativeCreateSpy   = this.stub(NativeAudio, 'create').callsFake(function() {
    return DummyConnection.create(...arguments);
  });

  let howlerCreateSpy   = this.stub(Howler, 'create').returns(sinon.createStubInstance(Howler));
  let localCreateSpy    = this.stub(LocalDummyConnection, 'create').returns(sinon.createStubInstance(LocalDummyConnection));

  let promise = service.load(testUrl);

  promise.then(() => {
    sound.trigger('audio-ready');

    assert.ok(howlerSpy.calledOnce, "howler canPlay should have been called");
    assert.ok(nativeSpy.calledOnce, "nativeSpy canPlay should have been called");
    assert.ok(localSpy.calledOnce, "local canPlay should not have been called");

    assert.equal(howlerCreateSpy.callCount, 0, "Howler connection should not have been used");
    assert.equal(nativeCreateSpy.callCount, 1, "Native connection should have been used");
    assert.equal(localCreateSpy.callCount, 0, "Local connection should not have been used");
    done();
  });
});

test('#load stops trying urls after a sound loads and reports accurately', function(assert) {
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });

  let done = assert.async();

  let badUrl1 = "/test/test-1.mp3";
  let badUrl2 = "/test/test-2.mp3";
  let goodUrl = "/test/test-3.mp3";
  let unusedUrl = "/test/test-4.mp3";
  let error1 = 'unknown error';
  let error2 = 'codec not supported';
  let expectedUrl;
  let expectedFailures;

  let LocalDummyConnection =  get(service, `_connections.LocalDummyConnection`);
  this.stub(LocalDummyConnection, 'canPlay').returns(true);

  let localCreateSpy = this.stub(LocalDummyConnection, 'create').callsFake(function(options) {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));

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

test('#load can take a promise that resolves urls', function(assert) {
  const service      = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });
  let done           = assert.async();

  let localCreateSpy = stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);
  let goodUrl        = "http://example.org/good.mp3";
  let urlPromise     = new Ember.RSVP.Promise(resolve => {
    Ember.run.later(() => resolve([goodUrl]), 800);
  });
  let expectedUrl;

  service.load(urlPromise).then(({sound}) => {
    expectedUrl = sound.get('url');
  }).finally(() => {
    assert.equal(localCreateSpy.callCount, 1, "create should only be called once");
    assert.equal(expectedUrl, goodUrl, "sound returned should have the successful url");
    done();
  });
});

test('When a sound gets created it gets registered with OneAtATime', function(assert) {
  let done = assert.async();
  assert.expect(1);
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });
  stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);

  let url = "/test/test.mp3";

  service.load(url).then(({sound}) => {
    assert.deepEqual(service.get('oneAtATime.sounds.firstObject'), sound, "sound should be registered with one at a time");
    done();
  });
});

test('When a sound plays it gets set as the currentSound', function(assert) {
  assert.expect(3);
  const service = this.subject({ options: chooseActiveConnections('NativeAudio') });
  stubConnectionCreateWithSuccess(service, "NativeAudio", this);

  let sound1, sound2;
  return service.load("/test/yes.mp3").then(({sound}) => {
    sound1 = sound;
    return service.load("/test/another-yes.mp3").then(({sound}) => {
      sound2 = sound;

      assert.notOk(service.get('currentSound'), "sound should not be set as current sound yet");

      sound1.play();
      assert.deepEqual(service.get('currentSound'), sound1, "sound1 should be set as current sound");

      sound2.play();
      assert.deepEqual(service.get('currentSound'), sound2, "sound2 should be set as current sound");
    });
  });
});

test('Calling setCurrentSound multiple times will not register duplicate events on the sound', function(assert) {
  assert.expect(2);
  const service = this.subject({ options: chooseActiveConnections('NativeAudio') });
  stubConnectionCreateWithSuccess(service, "NativeAudio", this);

  return service.load("/test/yes.mp3").then(({sound}) => {
    let callCount = 0;
    sound.play();
    service.on('audio-ended', () => {
      callCount = callCount + 1;
    });

    sound.trigger('audio-ended');

    assert.equal(callCount, 1, "ended event should have been fired once");

    service.setCurrentSound(sound);
    service.setCurrentSound(sound);
    service.setCurrentSound(sound);
    service.setCurrentSound(sound);

    sound.trigger('audio-ended');

    assert.equal(callCount, 2, "ended event should have been fired once");
  });
});

test('The second time a url is requested it will be pulled from the cache', function(assert) {
  let done = assert.async();
  assert.expect(5);
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });
  let localconnectionSpy = stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);

  let url = "/test/test.mp3";

  let soundCache = service.get('soundCache');
  let findSpy = this.stub(soundCache, 'find');
  let cacheSpy = this.stub(soundCache, 'cache');

  findSpy.onFirstCall().returns(false);

  service.load(url).then(({sound}) => {
    assert.equal(findSpy.callCount, 1, "cache should have been checked");
    assert.equal(cacheSpy.callCount, 1, "sound should be registered with sound cache");
    sound.set('identification', 'yo');
    findSpy.onSecondCall().returns(sound);

    service.load(url).then(({sound}) => {
      assert.equal(sound.get('identification'), 'yo', "should be the same sound in sound cache");
      assert.equal(localconnectionSpy.callCount, 1, "connection should not have been called again");
      assert.equal(findSpy.callCount, 2, "cache should have been checked");
      done();
    });
  });
});

test('The second time a url (with a mime type specified) is requested it will be pulled from the cache', function(assert) {
  let done = assert.async();
  assert.expect(5);
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });
  let localconnectionSpy = stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);

  let url = {url: "/test/test.mp3", mimeType: "audio/mp3"};

  let soundCache = service.get('soundCache');
  let findSpy = this.stub(soundCache, 'find');
  let cacheSpy = this.stub(soundCache, 'cache');

  findSpy.onFirstCall().returns(false);

  service.load(url).then(({sound}) => {
    assert.equal(findSpy.callCount, 1, "cache should have been checked");
    assert.equal(cacheSpy.callCount, 1, "sound should be registered with sound cache");
    sound.set('identification', 'yo');
    findSpy.onSecondCall().returns(sound);

    service.load(url).then(({sound}) => {
      assert.equal(sound.get('identification'), 'yo', "should be the same sound in sound cache");
      assert.equal(localconnectionSpy.callCount, 1, "connection should not have been called again");
      assert.equal(findSpy.callCount, 2, "cache should have been checked");
      done();
    });
  });
});


test('position gets polled regularly on the currentSound but not on the others', function(assert) {
  this.clock = sinon.useFakeTimers();

  const service = this.subject({ options });

  const INTERVAL = 500;

  let sound1 = LocalDummyConnection.create({});
  let sound2 = LocalDummyConnection.create({});

  let spy1 = this.spy(sound1, '_currentPosition');
  let spy2 = this.spy(sound2, '_currentPosition');

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

  let sound1 = LocalDummyConnection.create({});
  let sound2 = LocalDummyConnection.create({});

  let spy1 = this.spy(sound1, '_setVolume');
  let spy2 = this.spy(sound2, '_setVolume');

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

test('toggleMute returns sound to previous level', function(assert) {
  const service = this.subject({ options });
  assert.equal(service.get('volume'), service.get('defaultVolume'), "service should have default volume");
  service.set('volume', 55);
  service.toggleMute();

  assert.equal(service.get('volume'), 0, "volume should be zero");
  assert.equal(service.get('isMuted'), true, "volume should be muted");
  service.toggleMute();
  assert.equal(service.get('volume'), 55, "volume should be reset to previous level");
});

test("consumer can specify the connection to use with a particular url", function(assert) {
  let done = assert.async();
  let service = this.subject({ options: chooseActiveConnections('LocalDummyConnection', 'Howler', 'NativeAudio') });
  let nativeAudioSpy = stubConnectionCreateWithSuccess(service, "NativeAudio", this);

  service.load("/here/is/a/test/url/test.mp3", {useConnections: ['NativeAudio']}).then(() => {
    assert.equal(nativeAudioSpy.callCount, 1, "Native connection should have been called");
    done();
  });
});

test("consumer can specify the order of connections to be used with a some urls", function(assert) {
  let done = assert.async();

  let service           = this.subject({ options: chooseActiveConnections('LocalDummyConnection', 'Howler', 'NativeAudio') });
  let nativeAudioSpy    = stubConnectionCreateWithFailure(service, "NativeAudio", this);
  let localAudioSpy     = stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);
  let howlerAudioSpy    = stubConnectionCreateWithSuccess(service, "Howler", this);

  return service.load("/first/test.mp3", {useConnections: ['NativeAudio', 'LocalDummyConnection']}).then(() => {
    assert.equal(nativeAudioSpy.callCount, 1, "Native connection should have been called");
    assert.equal(localAudioSpy.callCount, 1, "local connection should have been called");
    assert.ok(nativeAudioSpy.calledBefore(localAudioSpy), "native audio should have been tried before local");

    return service.play("/second/test.mp3", {useConnections: ['NativeAudio', 'Howler']}).then(() => {
      assert.equal(nativeAudioSpy.callCount, 2, "Native connection should have been called");
      assert.equal(howlerAudioSpy.callCount, 1, "Native connection should have been called");
      assert.ok(nativeAudioSpy.calledBefore(howlerAudioSpy), "native audio should have been tried before howler");
      done();
    });
  });
});

test("consumer can specify a mime type for a url", function(assert) {
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });

  let done = assert.async();
  let fileObject = {url: "/test/sound-without-extension", mimeType: "audio/mpeg"};

  let LocalDummyConnection = get(service, `_connections.LocalDummyConnection`);

  let mimeTypeSpy = this.stub(LocalDummyConnection, 'canPlayMimeType').returns(true);
  let createSpy   = this.stub(LocalDummyConnection, 'create').callsFake(function() {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  let promise = service.load(fileObject);

  promise.then(() => {
    assert.ok(mimeTypeSpy.calledOnce, "local canPlayMimeType should have been called");
    assert.ok(createSpy.calledOnce, "A sound should have been created using the local dummy connection");

    done();
  });
});

test("if a mime type cannot be determined, try to play it anyway", function(assert) {
  const service = this.subject({ options: chooseActiveConnections('LocalDummyConnection') });

  let done = assert.async();
  let mysteryFile = "/test/sound-without-extension";

  let LocalDummyConnection = get(service, `_connections.LocalDummyConnection`);

  let createSpy   = this.stub(LocalDummyConnection, 'create').callsFake(function() {
    let sound = BaseSound.create(Object.assign({}, dummyOps, options));
    Ember.run.next(() => sound.trigger('audio-ready'));
    return sound;
  });

  let promise = service.load(mysteryFile);

  promise.then(() => {
    assert.ok(createSpy.calledOnce, "A sound should have been created");
    done();
  });

});

test("for desktop devices, try each url on each connection", function(assert) {
  let done = assert.async();
  let urls              = ["first-test-url.mp3", "second-test-url.mp3", "third-test-url.mp3"];
  let connections         = ['LocalDummyConnection', 'Howler', 'NativeAudio'];

  let service           = this.subject({ options: chooseActiveConnections(...connections) });
  service.set('isMobileDevice', false);

  stubConnectionCreateWithSuccess(service, "NativeAudio", this);
  stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);
  stubConnectionCreateWithSuccess(service, "Howler", this);

  let strategySpy       = this.spy(service, '_prepareStandardStrategies');
  let findAudioSpy      = this.spy(service, '_findFirstPlayableSound');

  return service.load(urls).then(() => {
    assert.equal(strategySpy.callCount, 1, "Standard strategy should have been used");
    assert.equal(findAudioSpy.callCount, 1, "Should have called internal find method with strategies");

    let correctOrder = [
      `${connections[0]}:${urls[0]}`,
      `${connections[1]}:${urls[0]}`,
      `${connections[2]}:${urls[0]}`,
      `${connections[0]}:${urls[1]}`,
      `${connections[1]}:${urls[1]}`,
      `${connections[2]}:${urls[1]}`,
      `${connections[0]}:${urls[2]}`,
      `${connections[1]}:${urls[2]}`,
      `${connections[2]}:${urls[2]}`,
    ];
    let strategies = findAudioSpy.firstCall.args[0];
    let actualOrder = [];
    strategies.forEach(strategy => {
      actualOrder.push(`${strategy.connectionName}:${strategy.url}`);
    });

    assert.deepEqual(actualOrder, correctOrder, "Breadth-first strategy should have been used");
    done();
  });
});

test("for mobile devices, try all the urls on the native audio connection first, and pass along an audio element", function(assert) {
  let done = assert.async();
  let urls              = ["first-test-url.mp3", "second-test-url.mp3", "third-test-url.mp3"];
  let connections       = ['LocalDummyConnection', 'Howler', 'NativeAudio'];
  let service           = this.subject({ options: chooseActiveConnections(...connections) });

  stubConnectionCreateWithSuccess(service, "NativeAudio", this);
  stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);
  stubConnectionCreateWithSuccess(service, "Howler", this);

  let strategySpy       = this.spy(service, '_prepareMobileStrategies');
  let findAudioSpy      = this.spy(service, '_findFirstPlayableSound');

  service.set('isMobileDevice', true);

  return service.load(urls).then(() => {
    assert.equal(strategySpy.callCount, 1, "Mobile strategy should have been used");
    assert.equal(findAudioSpy.callCount, 1, "Should have called internal find method with strategies");

    let correctOrder = [
      `${connections[2]}:${urls[0]}`,
      `${connections[2]}:${urls[1]}`,
      `${connections[2]}:${urls[2]}`,
      `${connections[0]}:${urls[0]}`,
      `${connections[1]}:${urls[0]}`,
      `${connections[0]}:${urls[1]}`,
      `${connections[1]}:${urls[1]}`,
      `${connections[0]}:${urls[2]}`,
      `${connections[1]}:${urls[2]}`,
    ];

    let actualOrder = [];
    let strategies = findAudioSpy.firstCall.args[0];
    strategies.forEach(strategy => {
      actualOrder.push(`${strategy.connectionName}:${strategy.url}`);
    });

    assert.deepEqual(actualOrder, correctOrder, "Native audio should have been prioritized first");
    let sharedAudioAccesss = Ember.A(Ember.A(strategies).map(s => s.sharedAudioAccess)).compact();
    assert.equal(sharedAudioAccesss.length, strategies.length, "audio element should have been included with the strategies");
    done();
  });
});

test("for mobile devices, audio element should still be passed if a custom strategy is used", function(assert) {
  let done        = assert.async();
  let urls        = ["first-test-url.mp3", "second-test-url.mp3", "third-test-url.mp3"];
  let connections = ['LocalDummyConnection', 'Howler', 'NativeAudio'];
  let service     = this.subject({ options: chooseActiveConnections(...connections) });

  stubConnectionCreateWithSuccess(service, "NativeAudio", this);
  stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);
  stubConnectionCreateWithSuccess(service, "Howler", this);

  let strategySpy       = this.spy(service, '_prepareMobileStrategies');
  let customStrategySpy = this.spy(service, '_prepareStrategies');
  let findAudioSpy      = this.spy(service, '_findFirstPlayableSound');

  service.set('isMobileDevice', true);

  return service.load(urls, {useConnections:['LocalDummyConnection']}).then(() => {
    assert.equal(strategySpy.callCount, 0, "Mobile strategy should not been used");
    assert.equal(customStrategySpy.callCount, 1, "custom strategy should have been used");
    assert.equal(findAudioSpy.callCount, 1, "Should have called internal find method with strategies");

    let correctOrder = [
      `${connections[0]}:${urls[0]}`,
      `${connections[0]}:${urls[1]}`,
      `${connections[0]}:${urls[2]}`,
    ];

    let actualOrder = [];
    let strategies = findAudioSpy.firstCall.args[0];

    findAudioSpy.firstCall.args[0].forEach(strategy => {
      actualOrder.push(`${strategy.connectionName}:${strategy.url}`);
    });

    assert.deepEqual(actualOrder, correctOrder, "Custom strategy should have been used");
    let sharedAudioAccesss = Ember.A(Ember.A(strategies).map(s => s.sharedAudioAccess)).compact();
    assert.equal(sharedAudioAccesss.length, strategies.length, "audio element should have been included with the strategies");
    done();
  });
});

test('you can specify alwaysUseSingleAudioElement in config to always use a single audio element', function(assert) {
  let options = chooseActiveConnections('LocalDummyConnection');
  set(options, 'emberHifi.alwaysUseSingleAudioElement', true);

  const service = this.subject({ options });
  assert.equal(get(service, 'alwaysUseSingleAudioElement'), true);
});

test("shared audio element should be passed if alwaysUseSingleAudioElement config option is specified", function(assert) {
  let done        = assert.async();
  let urls        = ["first-test-url.mp3", "second-test-url.mp3", "third-test-url.mp3"];
  let connections = ['LocalDummyConnection', 'Howler', 'NativeAudio'];
  let service     = this.subject({ options: chooseActiveConnections(...connections) });

  stubConnectionCreateWithSuccess(service, "NativeAudio", this);
  stubConnectionCreateWithSuccess(service, "LocalDummyConnection", this);
  stubConnectionCreateWithSuccess(service, "Howler", this);

  let findAudioSpy      = this.spy(service, '_findFirstPlayableSound');

  service.set('isMobileDevice', false);
  service.set('alwaysUseSingleAudioElement', true);

  return service.load(urls, {useConnections:['LocalDummyConnection']}).then(() => {
    let strategies = findAudioSpy.firstCall.args[0];

    let sharedAudioAccesss = Ember.A(Ember.A(strategies).map(s => s.sharedAudioAccess)).compact();
    assert.equal(sharedAudioAccesss.length, strategies.length, "audio element should have been included with the strategies");
    done();
  });
});

test("individual native audio sounds keep track of their own state", function(assert) {
  let done        = assert.async();
  let connections = ['NativeAudio'];
  let service     = this.subject({
    options: chooseActiveConnections(...connections),
    setCurrentSound() {}
  });
  let s1url       = "/assets/silence.mp3";
  let s2url       = "/assets/silence2.mp3";

  let sound1, sound2;
  service.load(s1url).then(({sound}) => {
    sound1 = sound;
    service.load(s2url).then(({sound}) => {
      sound2 = sound;

      sound1.set('position', 2000);
      assert.equal(sound2._currentPosition(), 0, "second sound should have its own position");

      sound2.play();
      sound2.set('position', 1000);

      assert.equal(sound1._currentPosition(), 2000, "first sound should still have its own position");
      assert.equal(sound2._currentPosition(), 1000, "second sound should still have its own position");

      sound1.play();
      assert.equal(sound1._currentPosition(), 2000, "first sound should still have its own position");
      sound2.set('position', 9000);
      sound2.play();
      assert.equal(sound2._currentPosition(), 9000, "second sound should still have its own position");
      sound2.one('audio-played', done);
    });
  }).catch(() => {
    done();
  });
});

test("sound can play on native audio using shared element one after the other", function(assert) {
  let done        = assert.async();
  let connections = ['NativeAudio'];
  let service     = this.subject({ options: chooseActiveConnections(...connections) });
  let s1url       = "/assets/silence.mp3";
  let s2url       = "/assets/silence2.mp3";

  service.set('isMobileDevice', true);

  return service.load(s1url).then(response => {
    let silence1 = response.sound;
    let sharedAccess = silence1.get('sharedAudioAccess');
    assert.equal(sharedAccess.get('audioElement'), silence1.audioElement(), "sound should be using shared element");

    silence1.on('audio-ended', function() {
      assert.ok("audio ended event was fired");

      service.play(s2url).then(r => {
        let silence2 = r.sound;
        assert.equal(sharedAccess.get('audioElement'), silence2.audioElement(), "second sound should be using shared element");
        done();
      });
    });

    silence1.play();
    silence1.set('position', 10 * 60 * 1000);
  });
});

test("service has access to the current sound inside the play callback", function(assert) {
  let done        = assert.async();
  let connections = ['NativeAudio'];
  let service     = this.subject({ options: chooseActiveConnections(...connections) });
  let s1url       = "/assets/silence.mp3";

  return service.play(s1url).then(({sound}) => {
    assert.equal(sound.get('position'), service.get('position'));
    done();
  });
});

test("service triggers `current-sound-changed` event when sounds change", function(assert) {
  let done        = assert.async();
  let connections = ['NativeAudio'];
  let service     = this.subject({ options: chooseActiveConnections(...connections) });
  let s1url       = "/assets/silence.mp3";
  let s2url       = "/assets/silence2.mp3";

  assert.expect(4);

  service.one('current-sound-changed', ({previousSound, currentSound}) => {
    assert.equal(previousSound, undefined, "there should not a previous sound");
    assert.equal(currentSound.get('url'), s1url, "current sound should be the first sound");
  });

  return service.play(s1url).then(() => {
    service.one('current-sound-changed', ({previousSound, currentSound}) => {
      assert.equal(previousSound.get('url'), "/assets/silence.mp3", "previous sound should be this sound");
      assert.equal(currentSound.get('url'), "/assets/silence2.mp3");
    });
    return service.play(s2url).then(() => done());
  });
});


test("metadata can be sent with a play and load request and it will stay with the sound", function(assert) {
  let done        = assert.async();
  let connections = ['NativeAudio'];
  let service     = this.subject({ options: chooseActiveConnections(...connections) });
  let s1url       = "/assets/silence.mp3";
  let s2url       = "/assets/silence2.mp3";

  let storyId = 12544;
  let currentSound;

  return service.play(s1url, {metadata: {
    storyId: storyId
  }}).then(({sound}) => {
    assert.equal(sound.get('metadata.storyId'), storyId, "storyId should be in metadata");
    currentSound = sound;
    return service.play(s2url).then(({sound}) => {
      assert.equal(sound.get('metadata.storyId'), undefined, "metadata hasn't been set and shouldn't exist");
      assert.equal(currentSound.get('metadata.storyId'), storyId, "storyId should be in saved sound");
      done();
    });
  });
});
