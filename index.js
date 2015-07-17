'use strict';

var path = require('path');

module.exports = {
  name: 'ember-cli-moment-shim',

  blueprintsPath: function blueprintsPath() {
    return path.join(__dirname, 'blueprints');
  },

  included: function(app) {
    this._super.included(app);

    var momentPath = path.join(
      app.bowerDirectory,
      'ember-cli-moment-shim',
      'moment-shim.js'
    );

    app.import(momentPath, {
      exports: {
        moment: ['default'],
      }
    });
  }
};
