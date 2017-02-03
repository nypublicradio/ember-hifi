import Ember from 'ember';
import DebugLoggingMixin from 'ember-hifi/mixins/debug-logging';
import { module, test } from 'qunit';

module('Unit | Mixin | debug logging');

// Replace this with your real tests.
test('it works', function(assert) {
  let DebugLoggingObject = Ember.Object.extend(DebugLoggingMixin);
  let subject = DebugLoggingObject.create();
  assert.ok(subject);
});
