import { moduleFor, test } from 'ember-qunit';

let baseSound;

moduleFor('ember-hifi@hifi-connection:base', 'Unit | Connection | base', {
  needs:['util:promise-race'],
  beforeEach() {
    baseSound = this.subject({
      currentPosition: function() {

      }
    });
  }
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
