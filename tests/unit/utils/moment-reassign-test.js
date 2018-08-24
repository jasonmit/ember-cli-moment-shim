/* globals self */

import { test, module } from 'qunit';
import moment from 'moment';

let originalMoment;

module('Unit | moment reassign', {
  beforeEach() {
    originalMoment = self.moment;
  },
  afterEach() {
    self.moment = originalMoment;
  }
});

test('moment exports', (assert) => {
  assert.ok(moment, 'moment exports an object');
});

test('moment.now reassigned equals self.moment.now', (assert) => {
  moment.now = () => 123;
  assert.equal(moment.now(), '123');
  assert.equal(self.moment.now(), moment.now());
});


test('self.moment.now reassigned equals moment.now', (assert) => {
  self.moment.now = () => 321;
  assert.equal(moment.now(), '321');
  assert.equal(self.moment.now(), moment.now());
});

test('moment now reassigned is utilized in moment().format()', (assert) => {
  moment.now = function() {
    return 1000;
  };

  assert.equal(moment.utc().year(), 1970);
});
