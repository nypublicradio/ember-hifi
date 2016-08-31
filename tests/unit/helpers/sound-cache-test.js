import SoundCache from 'dummy/helpers/sound-cache';
import { module, test } from 'qunit';
import Ember from 'ember';

module('Unit | Helper | sound cache');

const Sound = Ember.Object.extend({});

test("sounds can be retrieved by url from cache", function(assert) {
  assert.expect(3);
  let soundCache = new SoundCache();

  let sound1 = Sound.create({url: '/test/1'});
  let sound2 = Sound.create({url: '/test/2'});
  let sound3 = Sound.create({url: '/test/3'});

  soundCache.cache(sound1);
  soundCache.cache(sound2);
  soundCache.cache(sound3);

  assert.deepEqual(soundCache.find('/test/1'), sound1);
  assert.deepEqual(soundCache.find('/test/2'), sound2);
  assert.deepEqual(soundCache.find('/test/3'), sound3);
});
