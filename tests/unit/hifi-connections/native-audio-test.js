import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import Ember from 'ember';
// import NativeAudio from 'ember-hifi/hifi-connections/native-audio';

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
    // sandbox.server.respondImmediately = true;
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
  let sound = this.subject({url: badUrl, timeout: false});

  assert.expect(1);
  sound.on('audio-load-error', function() {
    assert.ok(true, "should have triggered audio load error");
    done();
  });

  sound.on('audio-ready', () => done());
});

test("If passed an audio element on initialize, use it instead of creating one", function(assert) {
  let testFlag = "hey, it's me";
  let audioElement = document.createElement('audio');
  audioElement.testFlag = testFlag;

  let sound = this.subject({url: goodUrl, audioElement: audioElement, timeout: false});

  assert.equal(sound.get('audio').testFlag, testFlag, "should have used passed audio element");
});

test("If it's a stream, we stop on pause", function(assert) {
  let sound   = this.subject({url: goodUrl, timeout: false});
  let stopSpy = sinon.spy(sound, 'stop');

  sound.play();
  assert.equal(sound.get('audio').src, goodUrl, "audio src attribute is set");

  sound.stop();
  // audio elements need their src attribute explicitly set to the empty string
  // to stop downloading a stream, i.e. setAttribute('src', '').
  // an attribute cleared with removeAttribute will return null when accessed
  // with getAttribute so we use the DOM api here to verify that it's the
  // empty string.
  Ember.run.next(() => {
    assert.equal(sound.get('audio').getAttribute('src').match('blob:').length, 1, "audio src attribute is set to an empty blob to stop loading");
    assert.equal(stopSpy.callCount, 1, "stop was called");
  });
});

test("stopping an audio stream still sends the pause event", function(assert) {
  let sound   = this.subject({url: goodUrl, timeout: false});

  sound.play();
  assert.equal(sound.get('audio').src, goodUrl, "audio src attribute is set");

  let eventFired = false;
  sound.on('audio-paused', function() {
    eventFired = true;
  });

  sound.stop();
  Ember.run.next(() => {
    assert.equal(eventFired, true, "pause event was fired");
  });
});
