import compare from 'dummy/utils/compare';
import moment from 'moment';
import { module, test } from 'qunit';

module('Unit | Utility | compare', function(/*hooks*/) {

  test('moment compare functions property', (assert) => {
    const instanceA = moment(0);
    const instanceB = moment(10000);
    const instanceC = moment(10000);

    assert.equal(compare(instanceA, instanceB), -1);
    assert.equal(compare(instanceB, instanceC), 0);
    assert.equal(compare(instanceB, instanceA), 1);
  });

  test('compare', (assert) => {
    moment.now = function() {
      return 1000;
    };

    const today = moment(10000);
    const yesterday = moment().subtract(1, 'day');

    assert.equal(compare(today, yesterday), 1);
    assert.equal(compare(yesterday, today), -1);
  });
});
