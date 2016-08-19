import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';
import Ember from 'ember';

let baseSound;

moduleFor('audio-pledge@audio-pledge-factory:base', 'Unit | Factory | base', {
  needs:['util:promise-try'],
  beforeEach() {
    baseSound = this.subject({
      currentPosition: function() {

      }
    });
  }
});

test('position only gets updated regularly when isPlaying is true', function(assert) {
  let done = assert.async();
  let spy = sinon.stub(baseSound, 'currentPosition');

  baseSound.set('pollInterval', 5); // for testing
  assert.equal(spy.callCount, 0);
  baseSound.set('isPlaying', true);

  Ember.run.later(() => {
    assert.equal(spy.callCount, 4, "should be called once every poll interval");
    done();
  }, 20);
});

test("isPlaying gets set when an 'audio-played' event is fired", function(assert) {
  let done = assert.async();

  assert.equal(baseSound.get('isPlaying'), false, "is playing should be false to start");
  baseSound.trigger("audio-played");
  assert.equal(baseSound.get('isPlaying'), true, "is playing should be true after firing event");

  done();
});

test("isPlaying gets set to false when an 'audio-paused' event is fired", function(assert) {
  let done = assert.async();
  baseSound.set('isPlaying', true);

  assert.equal(baseSound.get('isPlaying'), true, "is playing should be true to start");
  baseSound.trigger("audio-paused");
  assert.equal(baseSound.get('isPlaying'), false, "is playing should be false after firing event");
  done();
});

test("isPlaying gets set to false when an 'audio-stopped' event is fired", function(assert) {
  let done = assert.async();
  baseSound.set('isPlaying', true);

  assert.equal(baseSound.get('isPlaying'), true, "is playing should be true to start");
  baseSound.trigger("audio-stopped");
  assert.equal(baseSound.get('isPlaying'), false, "is playing should be false after firing event");

  done();
});
