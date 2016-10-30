import SharedAudioAccess from 'dummy/utils/shared-audio-access';
import { module, test } from 'qunit';

module('Unit | Utility | shared audio element');

// Replace this with your real tests.
test('it works', function(assert) {
  let result = SharedAudioAccess.unlock();
  assert.ok(result);
});

test('restricts access to the audio element', function(assert) {
  let sharedAudioAccess = SharedAudioAccess.unlock();
  let foo = {};
  let bar = {};
  sharedAudioAccess.requestControl(foo);

  assert.ok(sharedAudioAccess.hasControl(foo), 'foo has access');
  assert.notOk(sharedAudioAccess.hasControl(bar), 'bar does not have access');
  sharedAudioAccess.releaseControl(foo);
  assert.notOk(sharedAudioAccess.hasControl(bar), 'bar does not have access until it requests it');
  sharedAudioAccess.requestControl(bar);
  assert.ok(sharedAudioAccess.hasControl(bar), 'bar now can have access');
});
