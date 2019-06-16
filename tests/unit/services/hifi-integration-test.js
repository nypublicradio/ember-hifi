import { registerWaiter } from '@ember/test';
import { later } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { dummyHifi } from '../../../tests/helpers/hifi-integration-helpers';

let originalOnError = window.onerror;
function catchExpectedErrors(expectedErrors) {
  window.onerror = function(message) {
    if (!expectedErrors.includes(message)) {
      originalOnError.apply(window, arguments);
    }
  }
}

module('Unit | Service | hifi integration test.js', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:hifi', dummyHifi);
    this.hifi = this.owner.lookup('service:hifi')
  });

  hooks.afterEach(function() {
    window.onerror = originalOnError;
  });

  test('playing good url works', function(assert) {
    let service = this.owner.factoryFor('service:audio').create({})
    service.playGood().then(({sound}) => {
      assert.ok(sound);
    });
  });

  test('playing a bad url fails', async function(assert) {
    catchExpectedErrors(["Uncaught Error: All given promises failed."]);

    let service = this.owner.factoryFor('service:audio').create({});
    let failures, success = false;

    try {
      await service.playBad();
      success = true;
    } catch (results) {
      failures = results.failures;
      assert.ok(failures && failures.length > 0, "should have reported failures");
    }

    assert.equal(success, false, "should not be successful")
    window.onerror = originalOnError;
  });

  test('playing a blank url fails', async function(assert) {
    catchExpectedErrors(["Uncaught Error: [ember-hifi] URLs must be provided"]);
    let service = this.owner.factoryFor('service:audio').create({});
    let failures, results;

    try {
      await service.playBlank();
    } catch(r) {
      results = r;
      failures = results.failures;
      assert.ok(!failures, "should not be failures");
    }
  });

  test('it sets fixed duration correctly', function(assert) {
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.load('/good/2500/test').then(({sound}) => {
      assert.equal(sound.get('duration'), 2500);
    });
  });

  test('by default it succeeds and pretends its a 1 second long file', function(assert) {
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.load('http://test.example').then(({sound}) => {
      assert.equal(sound.get('duration'), 1000);
    });
  });

  test('it sets stream duration correctly', function(assert) {
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.load('/good/stream/test').then(({sound}) => {
      assert.equal(sound.get('duration'), Infinity, "duration should be infinity");
      assert.equal(sound.get('isStream'), true, "should be stream");
    })
  });

  test('it simulates play', function(assert) {
    registerWaiter(this, function() {
      return this.sound && this.sound.get('_tickInterval') * ticks === this.sound._currentPosition();
    });
    let done = assert.async();
    assert.expect(3);
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');
    let ticks = 5;

    hifi.play('/good/1500/test/yes').then(({sound}) => {
      this.sound = sound;
      let tickInterval = sound.get('_tickInterval');
      assert.equal(sound._currentPosition(), 0, "initial position should be 0");
      later(() => {
        assert.equal(sound._currentPosition(), tickInterval * ticks, `position should be ${tickInterval * ticks}`);
        assert.equal(sound.get('isPlaying'), true, "should be playing");
        done();
        sound.stop();
      }, (tickInterval * (ticks + 1)))
    });
  });

  test('it can not rewind before 0', function(assert) {
    let done = assert.async();
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.one('audio-will-rewind', (sound, {newPosition}) => {
      assert.equal(newPosition, 0, "sound should be at the end");
    });

    hifi.play('/good/1000/test').then(() => {
      hifi.rewind(5000);
      done();
    });
  });

  test('it can not fast forward past duration', function(assert) {
    let done = assert.async();
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.play('/good/1000/test').then(() => {
      hifi.fastForward(5000);
      assert.equal(hifi.get('position'), 1000, "sound should be at the end");
      done();
    });
  });

  test('it sends an audio-ended event when the sound ends',function(assert) {
    let done = assert.async();
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.one('audio-ended', (sound) => {
      assert.equal(sound.get('position'), 1000, "sound should be at the end");
    });

    hifi.play('/good/1000/test').then(() => {
      hifi.set('position', 5000);
      done();
    })
  });
});
