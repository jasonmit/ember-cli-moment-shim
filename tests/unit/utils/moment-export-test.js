import { test, module } from 'qunit';
import moment from 'moment';
import Ember from 'ember';

module('Unit | moment exports');

test('moment exports', (assert) => {
  assert.ok(moment, 'moment exports an object');
});

test('moment compare fn exists', (assert) => {
  const instance = moment();

  assert.equal(typeof instance.compare, 'function');
});

test('moment compare functions property', (assert) => {
  const instanceA = moment(0);
  const instanceB = moment(10000);
  const instanceC = moment(10000);

  assert.equal(instanceA.compare(instanceA, instanceB), -1);
  assert.equal(instanceB.compare(instanceB, instanceC), 0);
  assert.equal(instanceB.compare(instanceB, instanceA), 1);
});


test('moment tz fn exists', (assert) => {
  assert.equal(typeof moment.tz, 'function');
});

test('moment getLocale for `es`', (assert) => {
  assert.equal(typeof moment.localeData('es'), 'object');
});

test('moment.now is a class function', (assert) => {
  assert.equal(typeof moment.now, 'function');
});

test('moment.utc is a class function', (assert) => {
  assert.equal(typeof moment.utc, 'function');
});

test('moment().clone is an instance function', (assert) => {
  assert.equal(typeof moment().clone, 'function');
});
