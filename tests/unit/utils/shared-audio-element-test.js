import SharedAudioElement from 'dummy/utils/shared-audio-element';
import { module, test } from 'qunit';

module('Unit | Utility | shared audio element');

// Replace this with your real tests.
test('it works', function(assert) {
  let result = SharedAudioElement.unlock();
  assert.ok(result);
});

test('restricts access to the audio element', function(assert) {
  let sharedAudioElement = SharedAudioElement.unlock();
  let foo = {};
  let bar = {};
  sharedAudioElement.requestControl(foo);

  assert.ok(sharedAudioElement.hasControl(foo), 'foo has access');
  assert.notOk(sharedAudioElement.hasControl(bar), 'bar does not have access');
  sharedAudioElement.releaseControl(foo);
  assert.notOk(sharedAudioElement.hasControl(bar), 'bar does not have access until it requests it');
  sharedAudioElement.requestControl(bar);
  assert.ok(sharedAudioElement.hasControl(bar), 'bar now can have access');
});
