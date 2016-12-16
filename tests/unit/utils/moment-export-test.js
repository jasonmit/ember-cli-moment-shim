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

test('moment() instanceof moment', (assert) => {
  assert.equal(moment() instanceof moment, true);
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

test('ember computed sort can work with exported moment', (assert) => {
  const ObjClass = Ember.Object.extend({
    datesSortParam: ['date:asc'],
    sortedDateContainers: Ember.computed.sort('dateContainers', function(a, b) {
      return moment.compare(a.date, b.date);
    })
  });

  const obj = ObjClass.create({dateContainers: Ember.A([
    { date: moment(20000) },
    { date: moment(0) },
    { date: moment(10000) }
  ])});

  assert.equal(Number(obj.get('sortedDateContainers')[0].date), 0);
  assert.equal(Number(obj.get('sortedDateContainers')[1].date), 10000);
  assert.equal(Number(obj.get('sortedDateContainers')[2].date), 20000);
});
