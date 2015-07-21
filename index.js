'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var defaults = require('lodash.defaults');
var rename = require('broccoli-stew').rename;

var momentPath = path.dirname(require.resolve('moment'));

function makeArray(obj) {
  if (Array.isArray(obj)) {
    return obj;
  }

  if (typeof obj === 'undefined') {
    obj = [];
  }
  else {
    obj = [obj];
  }

  return obj;
}

module.exports = {
  name: 'moment',

  included: function(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    if (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    this.app = app;
    this.importDependencies(app);
  },

  importDependencies: function(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    var vendor = this.treePaths.vendor;
    var options = this.getConfig();

    app.import(path.join(vendor, 'moment', 'min', 'moment.min.js'));

    if (options.includeTimezone) {
      app.import(path.join(vendor, 'moment-timezone', 'tz.js'));
    }

    options.includeLocales.map(function(locale) {
      app.import(path.join(vendor, 'moment', 'locales', locale + '.js'))
    });
  },

  getConfig: function() {
    var projectConfig = ((this.project.config(process.env.EMBER_ENV) || {}).moment || {});

    var config = defaults(projectConfig, {
      includeTimezone: null,
      includeLocales: []
    });

    config.includeLocales = makeArray(config.includeLocales).filter(function(locale) {
      return typeof locale === 'string';
    }).map(function(locale) {
      return locale.replace('.js', '').trim().toLowerCase();
    });

    return config;
  },

  treeForVendor: function(vendorTree) {
    var trees = [];
    var options = this.getConfig();

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(new Funnel(momentPath, {
      destDir: 'moment',
      include: [new RegExp(/\.js$/)],
      exclude: ['tests', 'ender', 'package'].map(function(key) {
        return new RegExp(key + '\.js$');
      })
    }));

    if (options.includeLocales.length) {
      trees.push(new Funnel(momentPath, {
        srcDir: 'locale',
        destDir: path.join('moment', 'locales'),
        include: options.includeLocales.map(function(locale) {
          return new RegExp(locale + '.js$');
        })
      }));
    }

    if (options.includeTimezone) {
      var timezonePath = [this.project.bowerDirectory, 'moment-timezone', 'builds'];

      switch(options.includeTimezone) {
        case 'all':
          timezonePath.push('moment-timezone-with-data.min.js');
          break;
        case '2010-2020':
          timezonePath.push('moment-timezone-with-data-2010-2020.min.js');
          break;
        case 'none':
          timezonePath.push('moment-timezone.min.js');
          break;
        default:
          throw new Error("Ember Moment: Please specify the moment-timezone dataset to include as either 'all', '2010-2020', or 'none'.");
          break;
      }

      trees.push(rename(new Funnel(path.join(this.project.bowerDirectory, 'moment-timezone', 'builds'), {
        files: [timezonePath[timezonePath.length - 1]]
      }), function(filepath) {
        return path.join('moment-timezone', 'tz.js');
      }));
    }

    return mergeTrees(trees);
  }
};
