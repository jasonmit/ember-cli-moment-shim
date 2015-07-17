import moment from 'moment';
import Ember from 'ember';

module('Unit | moment exports');

test('moment exports', function(assert) {
  assert.ok(moment, 'moment exports an object');
});

test('moment instanceof Ember.Object', function(assert) {
  var instance = moment();
  assert.ok(instance instanceof Ember.Object);
});

test('moment compare fn exists', function(assert) {
  var instance = moment();
  assert.equal(typeof instance.compare, 'function');
});
