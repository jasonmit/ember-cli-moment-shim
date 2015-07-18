import Ember from 'ember';

let ComparableMoment = Ember.Object.extend(Ember.Comparable, moment.fn, {
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
  }
});

let comparableMoment = function() {
  return ComparableMoment.create(moment.apply(this, arguments));
};

for (let momentProp in moment) {
  if (moment.hasOwnProperty(momentProp)) {
    comparableMoment[momentProp] = moment[momentProp];
  }
}

// Wrap global moment methods that return a full moment object
['utc', 'unix'].forEach((method) => {
  comparableMoment[method] = function() {
    return ComparableMoment.create(moment[method].apply(this, arguments));
  };
});

ComparableMoment.reopen({
  clone() {
    return comparableMoment(this);
  }
});

export default comparableMoment;
