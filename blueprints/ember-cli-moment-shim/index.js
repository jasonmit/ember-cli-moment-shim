'use strict';

module.exports = {
  normalizeEntityName: function() {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  afterInstall: function() {
    // we need to install moment-timezone via bower since npmignore
    // ignores `moment-timezone/builds/*`
    return this.addBowerPackagesToProject([
      { name: 'moment', target: '>= 2.8.0' },
      { name: 'moment-timezone', target: '>= 0.1.0' }
    ]);
  }
};
