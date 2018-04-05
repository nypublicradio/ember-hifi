import $ from 'jquery';
import { next } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import SharedAudioAccess from 'dummy/utils/shared-audio-access';
import NativeAudio from 'ember-hifi/hifi-connections/native-audio';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "http://example.org/there-aint-nothing-here.aac";

module('Unit | Connection | Native Audio', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    // The use of this singleton here really messes with testing, so we need to reset it
    SharedAudioAccess._reset();

    sandbox = sinon.sandbox.create({
      useFakeServer: sinon.fakeServerWithClock
    });
    sandbox.server.respondWith(goodUrl, function (xhr) {
      xhr.respond(200, {}, []);
    });

    sandbox.server.respondWith(badUrl, function (xhr) {
      xhr.respond(404, {}, []);
    });
  });

  hooks.afterEach(function() {
    sandbox.restore();
  });

  test("If we 404, we give up", function(assert) {
    let done  = assert.async();
    let sharedAudioAccess = SharedAudioAccess.unlock();
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: badUrl, timeout: false, sharedAudioAccess});

    assert.expect(1);
    sound.on('audio-load-error', function() {
      assert.ok(true, "should have triggered audio load error");
      done();
    });
  });

  test("If passed a shared audio element on initialize, use it instead of creating one", function(assert) {
    let done = assert.async();
    let testFlag = "hey, it's me";
    let sharedAudioAccess = SharedAudioAccess.unlock();
    sharedAudioAccess.get('audioElement').testFlag = testFlag;

    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: goodUrl, sharedAudioAccess, timeout: false});
    sound.play();
    assert.equal(sound.audioElement().testFlag, testFlag, "should have used passed audio element");
    sound.on('audio-load-error', done);
  });

  test("If not passed a shared audio element on initialize, use our internal one", function(assert) {
    assert.expect(1);
    let done = assert.async();
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: "/assets/silence.mp3", timeout: false});

    sound.on('audio-played', function() {
      assert.ok("audio played with internal element");
      done();
    });

    sound.on('audio-load-error', done);

    sound.on('audio-ready', function() {
      sound.play();
    });
  });

  test("If it's a stream, we stop on pause", function(assert) {
    let sharedAudioAccess = SharedAudioAccess.unlock();
    let sound   = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: goodUrl, timeout: false, duration: Infinity, sharedAudioAccess});
    let stopSpy = sinon.spy(sound, 'stop');
    let loadSpy = sinon.spy(sound.get('sharedAudioAccess').requestControl(sound), 'load');

    sound.play();
    assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");

    sound.pause();

    next(() => {
      assert.equal(sound.audioElement().hasAttribute('src'), false, "audio src attribute is not set");
      assert.equal(loadSpy.callCount, 1, "load was called");
      assert.equal(stopSpy.callCount, 1, "stop was called");
    });
  });

  test("Don't fire audio-played events on position changes", function(assert) {
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: '/assets/silence.mp3', timeout: false});
    let done = assert.async();
    assert.expect(1);

    sound.on('audio-played', function() {
      assert.ok('audio event fired');
      sound._setPosition(1000);
      sound._setPosition(2000);
      sound._setPosition(3000);
      done();
    });
    
    sound.play();
  });

  test("stopping an audio stream still sends the pause event", function(assert) {
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound   = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: '/assets/silence.mp3', timeout: false, duration: Infinity, sharedAudioAccess});
    assert.expect(2);

    sound.one('audio-paused', function() {
      assert.ok("pause event was fired");
    });

    sound.play();
    assert.equal(sound.audioElement().src.split('/').pop(),  'silence.mp3', "audio src attribute is set");

    next(() => {
      sound.stop();
    });
  });

  test("can play an mp3 twice in a row using a shared audio element", function(assert) {
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: goodUrl, timeout: false, sharedAudioAccess});
    sound.on('audio-ended', () => assert.ok('ended was called'));
    sound.play();

    assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");
    assert.equal(sound.audioElement(), sharedAudioAccess.get('audioElement'), "internal audio tag is shared audio tag");

    $(sound.audioElement()).trigger('ended');
    sound.play();

    assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");
    assert.equal(sound.audioElement(), sharedAudioAccess.get('audioElement'), "internal audio tag is shared audio tag");
  });

  test("can play an mp3 twice in a row using internal element", function(assert) {
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: goodUrl, timeout: false});
    sound.on('audio-ended', () => assert.ok('ended was called'));
    sound.play();
    sound.set('position', 2000);

    assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");

    $(sound.audioElement()).trigger('ended');

    sound.play();

    assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");
  });

  test('switching sounds with a shared audio element saves the current state', function(assert) {
    let url1 = '/assets/silence.mp3';
    let url2 = '/assets/silence2.mp3';
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound1 = NativeAudio.create({url: url1, timeout: false, sharedAudioAccess});
    let sound2 = NativeAudio.create({url: url2, timeout: false, sharedAudioAccess});

    sinon.stub(sound1, 'debug');
    sinon.stub(sound2, 'debug');

    sound1.set('position', 2000);
    sound1.play(); // sound 1 has control

    sound2.set('position', 10000); // sound 2 should not affect sound 1

    assert.equal(sound1._currentPosition(), 2000, "sound 1 should have kept its position");

    sound2.play(); // sound 2 has control

    assert.equal(sound2._currentPosition(), 10000, "sound 2 should have kept its position");
  });

  test('switching sounds with internal elements keep current state', function(assert) {
    let url1 = '/assets/silence.mp3';
    let url2 = '/assets/silence2.mp3';

    let sound1 = NativeAudio.create({url: url1, timeout: false});
    let sound2 = NativeAudio.create({url: url2, timeout: false});

    sinon.stub(sound1, 'debug');
    sinon.stub(sound2, 'debug');

    sound1.set('position', 2000);
    sound1.play(); // sound 1 has control

    sound2.set('position', 10000); // sound 2 should not affect sound 1

    assert.equal(sound1._currentPosition(), 2000, "sound 1 should have kept its position");

    sound2.play(); // sound 2 has control

    assert.equal(sound2._currentPosition(), 10000, "sound 2 should have kept its position");
  });

  test('on setup the sound has control of the shared audio element', function(assert) {
    let url1 = '/assets/silence.mp3';
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound = NativeAudio.create({url: url1, timeout: false, sharedAudioAccess});
    sinon.stub(sound, 'debug');

    assert.equal(sound.audioElement(), sharedAudioAccess.get('audioElement'), "sound should have control on setup");
  });

  test('on play the sound gains control of the shared audio element', function(assert) {
    let url1 = '/assets/silence.mp3';
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound = NativeAudio.create({url: url1, timeout: false, sharedAudioAccess});
    sinon.stub(sound, 'debug');

    sound.play();
    assert.equal(sound.audioElement(), sharedAudioAccess.get('audioElement'), "sound should have control on setup");
  });

  test('sound does not have control of the shared audio element when another is playing', function(assert) {
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound1 = NativeAudio.create({url: "/assets/silence.mp3", timeout: false, sharedAudioAccess});
    let sound2 = NativeAudio.create({url: "/assets/silence2.mp3", timeout: false, sharedAudioAccess});

    sinon.stub(sound1, 'debug');
    sinon.stub(sound2, 'debug');

    sound1.play();
    sound2.play();

    assert.notEqual(sound1.audioElement(), sharedAudioAccess.get('audioElement'), "sound should have control while another sound is playing");
  });

  test("when using a shared audio element we set preload=none on the shadow element", function(assert) {
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound  = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: '/assets/silence2.mp3', timeout: false, duration: Infinity, sharedAudioAccess});

    sound.play();
    sound.stop();

    assert.equal(sound.get('_audioElement').preload,  'none', "audio preload attribute is none");
  });

  test('switching sounds with a shared audio element sends pause event on first sound', function(assert) {
    // let done = assert.async();
    let url1 = '/assets/silence.mp3';
    let url2 = '/assets/silence2.mp3';
    let sharedAudioAccess = SharedAudioAccess.unlock();

    let sound1 = NativeAudio.create({url: url1, timeout: false, sharedAudioAccess});
    let sound2 = NativeAudio.create({url: url2, timeout: false, sharedAudioAccess});

    let pauseStub = sinon.stub(sound1, '_onAudioPaused');

    sinon.stub(sound1, 'debug');
    sinon.stub(sound2, 'debug');

    sound1.play(); // sound 1 has control
    sound1.set('isPlaying', true);
    sound2.play(); // sound 2 has control

    assert.equal(pauseStub.callCount, 1, "audio 1 pause event should have been fired");
  });

  test("sounds update their isLoading property when they've loaded", function(assert) {
    let done = assert.async();
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:native-audio').create({url: '/assets/silence.mp3', timeout: false});
    let count = 0;
    sound.on('audio-loaded', function() {
      // BW 8/30/2017
      // audio-loaded is fired with audio-ready, which is fired on `loadeddata`, `canplay`, and `canplaythrough` events
      // this was originally meant to work around a firefox bug, but now we might able to just rely on canplaythrough
      count++;
      if (count === 3) {
        assert.ok('called loaded');
        done();
      }
    });
  });
});
