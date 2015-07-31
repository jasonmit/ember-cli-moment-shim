import { test, module } from 'qunit';
import moment from 'moment';
import Ember from 'ember';

module('Unit | moment exports');

test('moment exports', (assert) => {
  assert.ok(moment, 'moment exports an object');
});

test('moment instanceof Ember.Object', (assert) => {
  var instance = moment();
  assert.ok(instance instanceof Ember.Object);
});

test('moment compare fn exists', (assert) => {
  var instance = moment();
  assert.equal(typeof instance.compare, 'function');
});

test('moment tz fn exists', (assert) => {
  assert.equal(typeof moment.tz, 'function');
});

test('moment getLocale for `es`', (assert) => {
  assert.equal(typeof moment.localeData('es'), 'object');
});
