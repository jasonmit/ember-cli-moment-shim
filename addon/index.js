/* globals self */

import Ember from 'ember';

const moment = self.moment;

const ComparableMoment = Ember.Object.extend(Ember.Comparable, moment.fn, {
  compare(a, b) {
    if (moment.isMoment(a) && moment.isMoment(b) && a.isBefore(b)) {
      return -1;
    } else if (moment.isMoment(a) && moment.isMoment(b) && a.isAfter(b)) {
      return 1;
    } else if (moment.isMoment(a) && !moment.isMoment(b)) {
      return 1;
    } else if (moment.isMoment(b)) {
      return -1;
    }

    return 0;
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
      set(newValue) {
        moment[momentProp] = newValue;
      }
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
