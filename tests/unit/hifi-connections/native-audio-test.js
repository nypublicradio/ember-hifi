import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import Ember from 'ember';
import AccessControl from 'dummy/utils/access-control';
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
  let audioAccess = AccessControl.unlock();
  let sound = this.subject({url: badUrl, timeout: false, audioAccess});

  assert.expect(1);
  sound.on('audio-load-error', function() {
    assert.ok(true, "should have triggered audio load error");
    done();
  });
});

test("If passed an audio element on initialize, use it instead of creating one", function(assert) {
  let done = assert.async();
  let testFlag = "hey, it's me";
  let audioAccess = AccessControl.unlock();
  audioAccess.get('audioElement').testFlag = testFlag;

  let sound = this.subject({url: goodUrl, audioAccess, timeout: false});

  assert.equal(sound.get('audioAccess').requestAccess(sound).testFlag, testFlag, "should have used passed audio element");
  
  sound.on('audio-load-error', done);
});

test("If it's a stream, we stop on pause", function(assert) {
  let audioAccess = AccessControl.unlock();
  let sound   = this.subject({url: goodUrl, timeout: false, audioAccess});
  let stopSpy = sinon.spy(sound, 'stop');
  let loadSpy = sinon.spy(sound.get('audioAccess').requestAccess(sound), 'load');

  sound.play();
  assert.equal(sound.get('audioAccess').requestAccess(sound).src, goodUrl, "audio src attribute is set");

  sound.stop(sound.get('audioAccess').requestAccess(sound));
  // audio elements need their src attribute removed and then .load needs to be called
  // to stop downloading a stream

  Ember.run.next(() => {
    assert.equal(sound.get('audioAccess').requestAccess(sound).hasAttribute('src'), false, "audio src attribute is not set to stop loading");
    assert.equal(loadSpy.callCount, 1, "load was called");
    assert.equal(stopSpy.callCount, 1, "stop was called");
  });
});

test("stopping an audio stream still sends the pause event", function(assert) {
  let audioAccess = AccessControl.unlock();
  let sound   = this.subject({url: goodUrl, timeout: false, duration: Infinity, audioAccess});

  sound.play();
  assert.equal(sound.get('audioAccess').requestAccess(sound).src, goodUrl, "audio src attribute is set");

  let eventFired = false;
  sound.on('audio-paused', function() {
    eventFired = true;
  });

  sound.stop(sound.get('audioAccess').requestAccess(sound));
  Ember.run.next(() => {
    assert.equal(eventFired, true, "pause event was fired");
  });
});

test("can play an mp3 twice in a row", function(assert) {
  let audioAccess = AccessControl.unlock();
  let done  = assert.async();
  assert.expect(3);
  let sound = this.subject({url: goodUrl, timeout: false, audioAccess});
  sound.on('audio-ended', () => assert.ok('ended was called'));
  sound.play();
  assert.equal(sound.get('audioAccess').requestAccess(sound).src, goodUrl, "audio src attribute is set");
  Ember.$(sound.get('audioAccess').requestAccess(sound)).trigger('ended');
  sound.play();
  assert.equal(sound.get('audioAccess').requestAccess(sound).src, goodUrl, "audio src attribute is set");

  sound.on('audio-load-error', done);
});

test('switching sounds saves the current state', function(assert) {
  let done = assert.async();
  let url1 = '/audio1.mp3';
  let url2 = '/audio2.mp3';
  let audioAccess = AccessControl.unlock();
  let audio = audioAccess.audioElement;
  audio.play = function() {};
  audio.pause = function() {};
  
  let sound1 = NativeAudio.create({url: url1, timeout: false, audioAccess});
  let sound2 = NativeAudio.create({url: url2, timeout: false, audioAccess});
  sinon.stub(sound1, 'debug');
  sinon.stub(sound2, 'debug');
  
  sound1.on('audio-played', () => {
    sound1._setPosition(5000);
    sound1.pause();
    sound1._onAudioPaused();
  });
  sound1.on('audio-paused', () => {
    sound2.play();
    sound2._onAudioPlayed();
  });
  sound2.on('audio-played', () => {
    sound2._setPosition(10000);
    sound2.pause();
    sound2._onAudioPaused();
  })
  sound2.on('audio-paused', () => {
    assert.equal(sound1._currentPosition(), 5000, "sound1 should save it's own position");
    done();
  });
  sound1.play();
  sound1._onAudioPlayed();
});
