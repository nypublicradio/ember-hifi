import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import HLSFactory from 'audio-pledge/audio-pledge-factories/hls';

let sandbox;

moduleFor('audio-pledge@audio-pledge-factory:hls', 'Unit | Factory | base', {
  needs:['service:debug-logger',
         'audio-pledge@audio-pledge-factory:base'],
  beforeEach() {
    sandbox = sinon.sandbox.create();
  },
  afterEach() {
    sandbox.restore();
  }
});

test("HLS factory should say it can play files with m3u8 extension", function(assert) {
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
    assert.equal(HLSFactory.canPlay(url), false, `Should not play file with ${url}`);
  });

  goodUrls.forEach(url => {
    assert.equal(HLSFactory.canPlay(url), true, `Should be able to play file with ${url}`);
  });
});

test("On first media error stream will attempt a retry", function(assert) {
  
});

test("On second media error stream will switch codecs", function(assert) {

});

test("On third media error we will give up", function(assert) {

});
