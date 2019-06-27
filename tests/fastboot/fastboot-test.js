import { module, test } from 'qunit';
import { setup, visit } from 'ember-cli-fastboot-testing/test-support';
import { find } from '@ember/test-helpers';

module('Fastboot Integration', function(hooks) {
  setup(hooks);

  test('it works', async function(assert) {
    await visit('/fastboot');

    const element = find('h3');

    assert.ok(element.textContent.length > 0, 'There is a date');
  });
});
