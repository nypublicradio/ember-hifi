import Application from '@ember/application';
import { run } from '@ember/runloop';
import EmberHifiInitializer from 'dummy/instance-initializers/ember-hifi';
import { module, test } from 'qunit';

let application;

module('Unit | Initializer | ember-hifi', {
  beforeEach() {
    run(function() {
      application = Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function(assert) {
  EmberHifiInitializer.initialize(application);

  // you would normally confirm the results of the initializer here
  assert.ok(true);
});
