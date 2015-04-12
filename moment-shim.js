(function() {
  /* globals define, moment */

  var ComparableMoment = Ember.Object.extend(Ember.Comparable, moment.fn, {
    compare: function(a, b) {
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

  var comparableMoment = function() {
    return ComparableMoment.create(moment.apply(this, arguments));
  };

  for (var momentProp in moment) {
    if (moment.hasOwnProperty(momentProp)) {
      comparableMoment[momentProp] = moment[momentProp];
    }
  }

  // Wrap global moment methods that return a full moment object
  Ember.EnumerableUtils.forEach(['utc', 'unix'], function(method) {
    comparableMoment[method] = function() {
      return ComparableMoment.create(moment[method].apply(this, arguments));
    };
  });

  ComparableMoment.reopen({
    clone: function() {
      return comparableMoment(this);
    }
  });

  function generateModule(name, values) {
    define(name, [], function() {
      'use strict';

      return values;
    });
  }

  generateModule('moment', { 'default': comparableMoment});
})();
