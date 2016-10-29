import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import Ember from 'ember';
import SharedAudioElement from 'dummy/utils/shared-audio-element';
import NativeAudio from 'ember-hifi/hifi-connections/native-audio';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "http://example.org/there-aint-nothing-here.aac";

moduleFor('ember-hifi@hifi-connection:native-audio', 'Unit | Connection | Native Audio', {
  needs:['service:hifi-logger',
         'ember-hifi@hifi-connection:base'],
  beforeEach() {
    sandbox = sinon.sandbox.create({
      useFakeServer: sinon.fakeServerWithClock
    });
    sandbox.server.respondWith(goodUrl, function (xhr) {
      console.log("responded good");
      xhr.respond(200, {}, []);
    });

    sandbox.server.respondWith(badUrl, function (xhr) {
      console.log("responded bad");
      xhr.respond(404, {}, []);
    });
  },
  afterEach() {
    sandbox.restore();
  }
});

test("If we 404, we give up", function(assert) {
  let done  = assert.async();
  let sharedAudioElement = SharedAudioElement.unlock();
  let sound = this.subject({url: badUrl, timeout: false, sharedAudioElement});

  assert.expect(1);
  sound.on('audio-load-error', function() {
    assert.ok(true, "should have triggered audio load error");
    done();
  });
});

test("If passed a shared audio element on initialize, use it instead of creating one", function(assert) {
  let done = assert.async();
  let testFlag = "hey, it's me";
  let sharedAudioElement = SharedAudioElement.unlock();
  sharedAudioElement.get('audioElement').testFlag = testFlag;

  let sound = this.subject({url: goodUrl, sharedAudioElement, timeout: false});
  sound.play();
  assert.equal(sound.audioElement().testFlag, testFlag, "should have used passed audio element");
  sound.on('audio-load-error', done);
});

test("If it's a stream, we stop on pause", function(assert) {
  let sharedAudioElement = SharedAudioElement.unlock();
  let sound   = this.subject({url: goodUrl, timeout: false, duration: Infinity, sharedAudioElement});
  let stopSpy = sinon.spy(sound, 'stop');
  let loadSpy = sinon.spy(sound.get('sharedAudioElement').requestControl(sound), 'load');

  sound.play();
  assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");

  sound.pause();

  Ember.run.next(() => {
    assert.equal(sound.audioElement().hasAttribute('src'), false, "audio src attribute is not set");
    assert.equal(loadSpy.callCount, 1, "load was called");
    assert.equal(stopSpy.callCount, 1, "stop was called");
  });
});

test("stopping an audio stream still sends the pause event", function(assert) {
  let sharedAudioElement = SharedAudioElement.unlock();
  let sound   = this.subject({url: goodUrl, timeout: false, duration: Infinity, sharedAudioElement});

  sound.play();
  assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");

  let eventFired = false;
  sound.on('audio-paused', function() {
    eventFired = true;
  });

  sound.stop();
  Ember.run.next(() => {
    assert.equal(eventFired, true, "pause event was fired");
  });
});

test("can play an mp3 twice in a row", function(assert) {
  let sharedAudioElement = SharedAudioElement.unlock();

  let sound = this.subject({url: goodUrl, timeout: false, sharedAudioElement});
  sound.on('audio-ended', () => assert.ok('ended was called'));
  sound.play();

  assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");
  assert.equal(sound.audioElement(), SharedAudioElement.get('audioElement'), "internal audio tag is shared audio tag");

  Ember.$(sound.audioElement()).trigger('ended');
  sound.play();

  assert.equal(sound.audioElement().src, goodUrl, "audio src attribute is set");
  assert.equal(sound.audioElement(), SharedAudioElement.get('audioElement'), "internal audio tag is shared audio tag");
});

test('switching sounds saves the current state', function(assert) {
  let url1 = '/assets/silence.mp3';
  let url2 = '/assets/silence2.mp3';
  let sharedAudioElement = SharedAudioElement.unlock();

  let sound1 = NativeAudio.create({url: url1, timeout: false, sharedAudioElement});
  let sound2 = NativeAudio.create({url: url2, timeout: false, sharedAudioElement});

  sinon.stub(sound1, 'debug');
  sinon.stub(sound2, 'debug');

  sound1.set('position', 2000);
  sound1.play(); // sound 1 has control

  sound2.set('position', 10000); // sound 2 should not affect sound 1

  assert.equal(sound1.get('position'), 2000, "sound 1 should have kept its position");

  sound2.play(); // sound 2 has control

  assert.equal(sound2.get('position'), 10000, "sound 2 should have kept its position");
});

test('on setup the sound has control of the shared audio element', function(assert) {
  let url1 = '/assets/silence.mp3';
  let sharedAudioElement = SharedAudioElement.unlock();

  let sound = NativeAudio.create({url: url1, timeout: false, sharedAudioElement});
  sinon.stub(sound, 'debug');

  assert.equal(sound.audioElement(), sharedAudioElement.get('audioElement'), "sound should have control on setup");
});

test('on play the sound gains control of the shared audio element', function(assert) {
  let url1 = '/assets/silence.mp3';
  let sharedAudioElement = SharedAudioElement.unlock();

  let sound = NativeAudio.create({url: url1, timeout: false, sharedAudioElement});
  sinon.stub(sound, 'debug');

  sound.play();
  assert.equal(sound.audioElement(), sharedAudioElement.get('audioElement'), "sound should have control on setup");
});

test('sound does not have control of the shared audio element when another is playing', function(assert) {
  let sharedAudioElement = SharedAudioElement.unlock();

  let sound1 = NativeAudio.create({url: "/assets/silence.mp3", timeout: false, sharedAudioElement});
  let sound2 = NativeAudio.create({url: "/assets/silence2.mp3", timeout: false, sharedAudioElement});

  sinon.stub(sound1, 'debug');
  sinon.stub(sound2, 'debug');

  sound1.play();
  sound2.play();

  assert.notEqual(sound1.audioElement(), sharedAudioElement.get('audioElement'), "sound should have control while another sound is playing");
});

test('sound does not have control of the shared audio element when paused', function(assert) {
  let sharedAudioElement = SharedAudioElement.unlock();

  let sound1 = NativeAudio.create({url: "/assets/silence.mp3", timeout: false, sharedAudioElement});
  let sound2 = NativeAudio.create({url: "/assets/silence2.mp3", timeout: false, sharedAudioElement});

  sinon.stub(sound1, 'debug');
  sinon.stub(sound2, 'debug');

  sound1.play();
  sound1.pause();

  assert.ok(sound1.audioElement() !== sharedAudioElement.get('audioElement'), "sound1 should not have control while paused");
  assert.ok(sound2.audioElement() !== sharedAudioElement.get('audioElement'), "sound2 should not have control while paused");
});
