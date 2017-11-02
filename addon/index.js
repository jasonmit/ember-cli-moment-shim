import moment from './lib';
import Ember from 'ember';


function hasOwnProp(a, b) {
  return Object.prototype.hasOwnProperty.call(a, b);
}

function extend(a, b) {
  for (let propName in b) {
    if (hasOwnProp(b,propName)) {
      Object.defineProperty(a,propName, {
        enumerable: true,
        configurable: true,
        get() {
          return b[propName];
        },
        set(newValue) {
          b[propName] = newValue;
        }
      });
    }
  }

  // non-enumerable property
  ['toString', 'valueOf'].forEach(propName => {
    if (hasOwnProp(b, propName)) {
      Object.defineProperty(a, propName, {
        enumerable: false,
        configurable: true,
        get() {
          return b[propName];
        },
        set(newValue) {
          b[propName] = newValue;
        }
      });
    }
  });

  return a;
}

function createAugmentedMomentFrom(fn) {
  const augmentedMoment = function() {
    const m = fn(...arguments);
    const meta = Ember.meta(m);
    meta.writeMixins(Ember.guidFor(Ember.Copyable), Ember.Copyable);

    return m;
  }

  augmentedMoment.prototype = moment.prototype;

  extend(augmentedMoment, moment);

  return augmentedMoment;
}

function compare(a, b) {
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
}

moment.prototype.compare = compare;
moment.compare = compare;

moment.prototype.clone = function clone() {
  return augmentedMoment(this);
}

moment.prototype.copy = function copy(deep) {
  return this.clone();
}

const augmentedMoment = createAugmentedMomentFrom(moment);

export default augmentedMoment;
