import { A } from '@ember/array';
import { module, test, skip } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import HowlerConnection from 'ember-hifi/hifi-connections/howler';
// import { Howl } from 'howler';

let sandbox;
const goodUrl = "http://example.org/good.aac";
const badUrl  = "/there-aint-nothing-here.aac";

module('Unit | Connection | Howler', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    sandbox = sinon.createSandbox({
      useFakeServer: sinon.fakeServerWithClock
    });
    sandbox.server.respondImmediately = true;
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

  test("Howler should say it cannot play hls streams", function(assert) {
    let badUrls = A([
      "http://example.org/test.m3u8",
      "http://example.org/test.m3u8?query_params",
      "http://example.org/test.m3u8#could_happen?maybe"
    ]);

    let goodUrls = A([
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
    let badFiles = A([
      {url: "http://example.org/test.m3u8", mimeType: "application/vnd.apple.mpegurl"},
    ]);

    let goodFiles = A([
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
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:howler').create({url: badUrl});

    sound.on('audio-load-error', function() {
      assert.ok(true, "should have triggered audio load error");
      done();
    });
  });

  skip("Howler should fire audio-ended event when a file finishes", function(assert) {
    assert.expect(2);
    let done = assert.async();
    let url   = "/assets/silence.mp3";
    let sound = this.owner.factoryFor('ember-hifi@hifi-connection:howler').create({
      url: url,
      audioReady: function() {
        sound.set('position', 9 * 1000);
        sound.play();
      },
      audioEnded: function() {
        assert.ok('service fires audio-ended');
        assert.notOk(sound.get('isPlaying'), 'isPlaying should be false');
        sound.off('audio-ended');
        done();
      }
    });


    sound.setup();
  });
});
