import AccessControl from 'dummy/utils/access-control';
import { module, test } from 'qunit';

module('Unit | Utility | access control');

// Replace this with your real tests.
test('it works', function(assert) {
  let result = AccessControl.unlock();
  assert.ok(result);
});

test('restricts access to the audio element', function(assert) {
  let accessControl = AccessControl.unlock();
  let foo = {};
  let bar = {};
  let audio = accessControl.requestAccess(foo);
  assert.ok(audio, 'returns an audio element');
  assert.ok(accessControl.hasAccess(foo), 'foo has access');
  assert.notOk(accessControl.hasAccess(bar), 'bar does not have access');
  accessControl.releaseAccess(foo);
  assert.ok(accessControl.hasAccess(bar), 'foo has released access and now bar can have access');
});
