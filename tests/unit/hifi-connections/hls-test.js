import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import { skip } from 'qunit';
import HLSConnection from 'ember-hifi/hifi-connections/hls';
import { setupHLSSpies, throwMediaError } from '../../helpers/hls-test-helpers';

let sandbox;
const goodUrl = "http://example.org/good.m3u8";
const badUrl  = "http://example.org/bad.m3u8";

moduleFor('ember-hifi@hifi-connection:hls', 'Unit | Connection | HLS', {
  needs:['service:debug-logger',
         'ember-hifi@hifi-connection:base'],
  beforeEach() {
    sandbox = sinon.sandbox.create({
      useFakeServer: sinon.fakeServerWithClock
    });

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

test("HLS connection should say it can play files with m3u8 extension", function(assert) {
  let goodUrls = Ember.A([
    "http://example.org/test.m3u8",
    "http://example.org/test.m3u8?query_params",
    "http://example.org/test.m3u8#could_happen?maybe"
  ]);

  let badUrls = Ember.A([
    "http://example.org/test.mp3",
    "http://example.org/test.aac",
    "http://example.org/test.wav"
  ]);

  assert.expect(badUrls.length + goodUrls.length);

  badUrls.forEach(url => {
    assert.equal(HLSConnection.canPlay(url), false, `Should not play file with ${url}`);
  });

  goodUrls.forEach(url => {
    assert.equal(HLSConnection.canPlay(url), true, `Should be able to play file with ${url}`);
  });
});

test("On first media error stream will attempt a retry", function(assert) {
  let sound = this.subject({url: goodUrl});

  let {
    destroySpy, switchSpy, recoverSpy
  } = setupHLSSpies(sound.get('hls'));

  throwMediaError(sound);

  assert.equal(recoverSpy.callCount, 1, "should try media recovery");
  assert.equal(switchSpy.callCount, 0, "should not try codec switching yet");
  assert.equal(destroySpy.callCount, 0, "should not destroy");
});

test("On second media error stream will try switching codecs", function(assert) {
  let sound           = this.subject({url: goodUrl});

  let {
    destroySpy, switchSpy, recoverSpy
  } = setupHLSSpies(sound.get('hls'));

  throwMediaError(sound);
  throwMediaError(sound);

  assert.equal(recoverSpy.callCount, 2, "should try media recovery");
  assert.equal(switchSpy.callCount, 1, "should try switching yet");
  assert.equal(destroySpy.callCount, 0, "should not destroy");
});

test("On third media error we will give up", function(assert) {
  let sound           = this.subject({url: goodUrl});
  let loadErrorFired = false;

  sound.on('audio-load-error', function() {
    loadErrorFired = true;
  });

  let {
    destroySpy, switchSpy, recoverSpy
  } = setupHLSSpies(sound.get('hls'));

  throwMediaError(sound);
  throwMediaError(sound);
  throwMediaError(sound);

  assert.equal(recoverSpy.callCount, 2, "should try media recovery");
  assert.equal(switchSpy.callCount, 1, "should try switching yet");
  assert.equal(destroySpy.callCount, 1, "should destroy");
  assert.ok(loadErrorFired, "should have triggered audio load error");
});

// TODO: make this work
skip("If we 404, we give up", function(assert) {
  assert.expect(3);
  let sound           = this.subject({url: badUrl});
  let { destroySpy }  = setupHLSSpies(sound.get('hls'));
  // let giveUpSpy = sinon.spy(sound, '_giveUpAndDie');

  sound.on('audio-load-error', function() {
    assert.ok(true, "should have triggered audio load error");
  });

  assert.ok(sound);
  assert.equal(destroySpy.callCount, 1, "should destroy");
});
