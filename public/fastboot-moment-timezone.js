(function() {
  if (typeof FastBoot !== 'undefined' && FastBoot.require) {
    define('moment/lib', ['exports'], function(self) {
      self['default'] = FastBoot.require('moment-timezone');
    });
  }
})();
