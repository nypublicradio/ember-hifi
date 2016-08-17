import OneAtATime from 'dummy/helpers/one-at-a-time';
import { module, test } from 'qunit';
import Ember from 'ember';

module('Unit | Helper | one at a time');

const Sound = Ember.Object.extend(Ember.Evented, {
  play() {
    this.trigger('audio-played');
    this.set('isPlaying', true);
  },
  pause() {
    this.trigger('audio-paused');
    this.set('isPlaying', false);
  }
});

test("only one sound should play at a time", function(assert) {
  assert.expect(3);
  let oneAtATime = new OneAtATime();

  let sound1 = new Sound();
  let sound2 = new Sound();
  let sound3 = new Sound();
  oneAtATime.register(sound1);
  oneAtATime.register(sound2);
  oneAtATime.register(sound3);

  sound1.play();
  assert.deepEqual([sound1, sound2, sound3].map(s => s.get('isPlaying')), [true, false, false], "sound 1 should be the only thing playing");

  sound2.play();
  assert.deepEqual([sound1, sound2, sound3].map(s => s.get('isPlaying')), [false, true, false], "sound 2 should be the only thing playing");

  sound3.play();
  assert.deepEqual([sound1, sound2, sound3].map(s => s.get('isPlaying')), [false, false, true], "sound 3 should be the only thing playing");
});
