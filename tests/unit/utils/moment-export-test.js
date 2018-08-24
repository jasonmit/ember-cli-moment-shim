import { A } from '@ember/array';
import { sort } from '@ember/object/computed';
import EmberObject from '@ember/object';
import { test, module } from 'qunit';
import compare from 'ember-cli-moment-shim/utils/compare';
// import moment from 'moment';
import moment from 'moment-timezone';

module('Unit | moment exports');

test('moment exports', (assert) => {
  assert.ok(moment, 'moment exports an object');
});

test('moment() instanceof moment', (assert) => {
  assert.equal(moment() instanceof moment, true);
});

test('moment has `updateLocale`', (assert) => {
  assert.equal(typeof moment.updateLocale, 'function');
});

test('moment tz fn exists', (assert) => {
  assert.equal(typeof moment.tz, 'function');
});

test('moment getLocale for `es`', (assert) => {
  assert.equal(typeof moment.localeData('es'), 'object');
});

test('moment only has selected locales`', (assert) => {
  // Note: 'en' is always present in moment
  assert.deepEqual(moment.locales(), ['en', 'es']);
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
  const ObjClass = EmberObject.extend({
    init() {
      this._super();
      this.datesSortParam = ['date:asc'];
    },
    sortedDateContainers: sort('dateContainers', function(a, b) {
      return compare(a.date, b.date);
    })
  });

  const obj = ObjClass.create({dateContainers: A([
    { date: moment(20000) },
    { date: moment(0) },
    { date: moment(10000) }
  ])});

  assert.equal(Number(obj.get('sortedDateContainers')[0].date), 0);
  assert.equal(Number(obj.get('sortedDateContainers')[1].date), 10000);
  assert.equal(Number(obj.get('sortedDateContainers')[2].date), 20000);
});
