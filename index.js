'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'moment',

  included: function(app) {
    this._super.included(app);
    app.import(path.join(this.treePaths.vendor, 'moment', 'min', 'moment.min.js'));
  },

  treeForVendor: function(vendorTree) {
    var trees = [];
    var momentPath = path.dirname(require.resolve('moment'));

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(new Funnel(this.treeGenerator(momentPath), {
      destDir: 'moment',
      include: [new RegExp(/\.js$/)],
      exclude: ['tests', 'ender', 'package'].map(function(key) {
        return new RegExp(key + '\.js$');
      })
    }));

    return mergeTrees(trees);
  }
};
