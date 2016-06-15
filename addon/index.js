/* globals self */

import Ember from 'ember';

const moment = self.moment;

const ComparableMoment = Ember.Object.extend(Ember.Comparable, moment.fn, {
  compare(a, b) {
    if (moment.isMoment(a) && moment.isMoment(b)) {
      if (a.isBefore(b)) {
        return -1;
      } else if (a.isSame(b)) {
        return 0;
      } else {
        return 1;
      }
    }

    throw new Error('Arguments provided to `compare` are not moment objects');
  },

  clone() {
    return comparableMoment(this);
  }
});

function comparableMoment() {
  return ComparableMoment.create(moment(...arguments));
};

for (let momentProp in moment) {
  if (moment.hasOwnProperty(momentProp)) {
    Object.defineProperty(comparableMoment, momentProp, {
      enumerable: true,
      configurable: true,
      get() { return moment[momentProp]; },
      set(newValue) { moment[momentProp] = newValue; }
    });
  }
}

// Wrap global moment methods that return a full moment object
['utc', 'unix'].forEach((methodName) => {
  comparableMoment[methodName] = function() {
    return ComparableMoment.create(moment[methodName](...arguments));
  };
});

export default comparableMoment;
