import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';
import { dummyHifi, hifiNeeds } from '../../../tests/helpers/hifi-integration-helpers';
var originalLoggerError, originalTestAdapterException;

moduleFor('service:audio', 'Unit | Service | hifi integration test.js', {
  needs: [...hifiNeeds],

  beforeEach() {
    this.register('service:hifi', dummyHifi);
    this.inject.service('hifi')

    /* disable erroneous throwing of errors for rejected promises
     https://github.com/emberjs/ember.js/issues/11469#issuecomment-228132452 */

    originalLoggerError = Ember.Logger.error;
    originalTestAdapterException = Ember.Test.adapter.exception;
    Ember.Logger.error = function() {};
    Ember.Test.adapter.exception = function() {};
  },
  afterEach() {
    Ember.Logger.error = originalLoggerError;
    Ember.Test.adapter.exception = originalTestAdapterException;
  }
});

test('playing good url works', function(assert) {
  let service = this.subject({})
  service.playGood().then(({sound}) => {
    assert.ok(sound);
  });
});

test('playing a bad url fails', function(assert) {
  let service = this.subject({});
  let failures, success;

  let play = service.playBad();

  play.then(() => (success = true));
  play.catch((results) => {
    failures = results.failures;
    assert.ok(failures && failures.length > 0, "should have reported failures");
  });

  assert.equal(!!success, false, "should not be successful")
});

test('playing a blank url fails', function(assert) {
  let service = this.subject({});
  let failures, results;

  Ember.run(() => {
    service.playBlank().catch(r => {
      results = r;
      failures = results.failures;
    });

    assert.ok(!failures, "should not be failures");
  });
});

test('it sets fixed duration correctly', function(assert) {
  let service = this.subject({});
  let hifi = service.get('hifi');

  hifi.load('/good/2500/test').then(({sound}) => {
    assert.equal(sound.get('duration'), 2500);
  });
});

test('it sets stream duration correctly', function(assert) {
  let service = this.subject({});
  let hifi = service.get('hifi');

  hifi.load('/good/stream/test').then(({sound}) => {
    assert.equal(sound.get('duration'), Infinity, "duration should be infinity");
    assert.equal(sound.get('isStream'), true, "should be stream");
  })
});

test('it simulates play', function(assert) {
  let done = assert.async();
  assert.expect(3);
  let service = this.subject({});
  let hifi = service.get('hifi');

  hifi.play('/good/1500/test/yes').then(({sound}) => {
    assert.equal(sound._currentPosition(), 0, "initial position should be 0");

    Ember.run.later(() => {
      assert.equal(sound._currentPosition(), 1000, "position should be 1000");
      assert.equal(sound.get('isPlaying'), true, "should be playing");
      done();
    }, 1000)
  });
});
