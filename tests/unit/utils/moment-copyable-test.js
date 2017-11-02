import { test, module } from 'qunit';
import moment from 'moment';
import Ember from 'ember';

module('Unit | moment copyable');

test('moment exports', (assert) => {
  assert.ok(moment, 'moment exports an object');
});

test('moment() implements Copyable mixin and "copy" fn exists', (assert) => {
  const instance = moment();

  assert.ok(Ember.Copyable.detect(instance));
  assert.equal(typeof instance.copy, 'function');
});

test('moment()\'s copy implements Copyable mixin and "copy" fn exists', (assert) => {
  const instance = moment();
  const instanceCopy = Ember.copy(instance);

  assert.ok(Ember.Copyable.detect(instanceCopy));
  assert.equal(typeof instanceCopy.copy, 'function');
})

test('Copy a moment instance and modify it', (assert) => {
  const instance = moment();
  const instanceCopy = Ember.copy(instance);

  instanceCopy.add(7, 'd');

  assert.notOk(instanceCopy.isSame(instance), "Modified copy is not identical to the original.");
})
