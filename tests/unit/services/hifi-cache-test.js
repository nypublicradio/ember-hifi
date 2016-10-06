import { moduleFor, test } from 'ember-qunit';
import Ember from 'ember';

moduleFor('service:hifi-cache', 'Unit | Service | sound cache', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

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

test("sounds can be retrieved by url from cache", function(assert) {
  assert.expect(3);
  let service = this.subject();

  let sound1 = Sound.create({url: '/test/1'});
  let sound2 = Sound.create({url: '/test/2'});
  let sound3 = Sound.create({url: '/test/3'});

  service.cache(sound1);
  service.cache(sound2);
  service.cache(sound3);

  assert.deepEqual(service.find('/test/1'), sound1);
  assert.deepEqual(service.find('/test/2'), sound2);
  assert.deepEqual(service.find('/test/3'), sound3);
});
