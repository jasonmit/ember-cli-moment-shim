/* global define, self, FastBoot */

(function() {
  if (typeof FastBoot !== 'undefined' && FastBoot.require) {
    define('moment/range', ['exports'], function(self) {
      var momentRange = FastBoot.require('moment-range');
      self['default'] = momentRange;
      self['extendMoment'] = momentRange.extendMoment;
      self['DataRange'] = momentRange.DataRange;
    });
  }
})();
