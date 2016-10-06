import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import HowlerConnection from 'ember-hifi/hifi-connections/howler';
// import { Howl } from 'howler';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "/there-aint-nothing-here.aac";

moduleFor('ember-hifi@hifi-connection:howler', 'Unit | Connection | Howler', {
  needs:['service:hifi-logger',
         'ember-hifi@hifi-connection:base'],
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
    assert.equal(HowlerConnection.canPlay(url), false, `Should not play file with ${url}`);
  });

  goodUrls.forEach(url => {
    assert.equal(HowlerConnection.canPlay(url), true, `Should be able to play file with ${url}`);
  });
});

test("Howler should report playability of file objects", function(assert) {
  let badFiles = Ember.A([
    {url: "http://example.org/test.m3u8", mimeType: "application/vnd.apple.mpegurl"},
  ]);
  
  let goodFiles = Ember.A([
    {url: "http://example.org/test.mp3", mimeType: "audio/mpeg"},
    {url: "http://example.org/test.aac", mimeType: "audio/aac"},
    {url: "http://example.org/test.wav", mimeType: "audio/wav"}
  ]);

  assert.expect(badFiles.length + goodFiles.length);

  badFiles.forEach(url => {
    assert.equal(HowlerConnection.canPlay(url), false, `Should not play file with mime type ${url.mimeType}`);
  });

  goodFiles.forEach(url => {
    assert.equal(HowlerConnection.canPlay(url), true, `Should be able to play file with ${url.mimeType}`);
  });
});

test("If we 404, we give up", function(assert) {
  assert.expect(1);
  let done = assert.async();
  let sound           = this.subject({url: badUrl});

  sound.on('audio-load-error', function() {
    assert.ok(true, "should have triggered audio load error");
    done();
  });
});
