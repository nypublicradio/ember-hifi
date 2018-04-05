import EmberObject from '@ember/object';
import DebugLoggingMixin from 'ember-hifi/mixins/debug-logging';
import { module, test } from 'qunit';

module('Unit | Mixin | debug logging', function() {
  // Replace this with your real tests.
  test('it works', function(assert) {
    let DebugLoggingObject = EmberObject.extend(DebugLoggingMixin);
    let subject = DebugLoggingObject.create();
    assert.ok(subject);
  });
});
