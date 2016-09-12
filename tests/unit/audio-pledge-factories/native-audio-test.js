import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
// import NativeAudio from 'audio-pledge/audio-pledge-factories/native-audio';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "http://example.org/there-aint-nothing-here.aac";

moduleFor('audio-pledge@audio-pledge-factory:native-audio', 'Unit | Factory | Native Audio', {
  needs:['service:debug-logger',
         'audio-pledge@audio-pledge-factory:base'],
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
  assert.equal(sound.get('audio').src, "", "audio src attribute is not set");
  assert.equal(stopSpy.callCount, 1, "stop was called");
});
