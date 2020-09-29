import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Helper | json-stringify', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    this.set('inputValue', { title: 'Morning Edition'});

    await render(hbs`{{json-stringify inputValue}}`);

    assert.equal(this.element.textContent.trim(), '{"title":"Morning Edition"}');
  });

  test('a null input returns an empty string', async function(assert) {
    this.set('inputValue', null);

    await render(hbs`{{json-stringify inputValue}}`);

    assert.equal(this.element.textContent.trim(), '');
  });

  test('an undefined/null input returns an empty string', async function(assert) {
    this.set('inputValue', undefined);

    await render(hbs`{{json-stringify inputValue}}`);

    assert.equal(this.element.textContent.trim(), '');

    this.set('inputValue', null);

    await render(hbs`{{json-stringify inputValue}}`);

    assert.equal(this.element.textContent.trim(), '');
  });
});
