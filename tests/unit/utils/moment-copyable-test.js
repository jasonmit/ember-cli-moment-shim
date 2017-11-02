import { test, module } from 'qunit';
import moment from 'moment';
import Ember from 'ember';

module('Unit | moment copyable');

test('moment exports', (assert) => {
  assert.ok(moment, 'moment exports an object');
});
