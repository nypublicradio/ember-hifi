import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
// import NativeAudio from 'audio-pledge/audio-pledge-factories/native-audio';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "/there-aint-nothing-here.aac";

moduleFor('audio-pledge@audio-pledge-factory:native-audio', 'Unit | Factory | Native Audio', {
  needs:['service:debug-logger',
         'audio-pledge@audio-pledge-factory:base'],
  beforeEach() {
    sandbox = sinon.sandbox.create({
      useFakeServer: sinon.fakeServerWithClock
    });
    sandbox.server.respondImmediately = true;
    sandbox.server.respondWith(goodUrl, function (xhr) {
      xhr.respond(200, {}, []);
    });

    sandbox.server.respondWith(badUrl, function (xhr) {
      xhr.respond(404, {}, []);
    });
  },
  afterEach() {
    sandbox.restore();
  }
});

test("If we 404, we give up", function(assert) {
  let done  = assert.async();
  let sound = this.subject({url: badUrl});
  assert.expect(1);
  sound.on('audio-load-error', function() {
    assert.ok(true, "should have triggered audio load error");
    done();
  });
});
