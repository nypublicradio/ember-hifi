import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import { skip } from 'qunit';
import sinon from 'sinon';
import HowlerFactory from 'audio-pledge/audio-pledge-factories/howler';
// import { Howl } from 'howler';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "/there-aint-nothing-here.aac";

moduleFor('audio-pledge@audio-pledge-factory:howler', 'Unit | Factory | Howler', {
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


test("Howler should say it cannot play hls streams", function(assert) {
  let badUrls = Ember.A([
    "http://example.org/test.m3u8",
    "http://example.org/test.m3u8?query_params",
    "http://example.org/test.m3u8#could_happen?maybe"
  ]);

  let goodUrls = Ember.A([
    "http://example.org/test.mp3",
    "http://example.org/test.aac",
    "http://example.org/test.wav"
  ]);

  assert.expect(badUrls.length + goodUrls.length);

  badUrls.forEach(url => {
    assert.equal(HowlerFactory.canPlay(url), false, `Should not play file with ${url}`);
  });

  goodUrls.forEach(url => {
    assert.equal(HowlerFactory.canPlay(url), true, `Should be able to play file with ${url}`);
  });
});


// TODO make this work
skip("If we 404, we give up", function(assert) {
  let done = assert.async();
  let sound           = this.subject({url: badUrl});
  let loadErrorFired = false;

  sound.on('audio-load-error', function() {
    loadErrorFired = true;
    done();
  });

  assert.ok(loadErrorFired, "should have triggered audio load error");
});
