'use strict';

module.exports = {
  normalizeEntityName: function() {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  afterInstall: function() {
    return this.addPackagesToProject([
      { name: 'moment', target: '^2.8.0' },
      { name: 'moment-timezone', target: '^0.5.0' }
    ]);
  }
};
