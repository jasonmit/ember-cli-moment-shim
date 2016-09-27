/*jshint node:true*/

'use strict';

var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var defaults = require('lodash.defaults');
var rename = require('broccoli-stew').rename;
var existsSync = require('exists-sync');
var chalk = require('chalk');
var path = require('path');

module.exports = {
  name: 'moment',

  included: function(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    this.app = app;
    this.momentOptions = this.getConfig();

    if (isFastBoot()) {
      this.importFastBootDependencies(app);
    } else {
      this.importBrowserDependencies(app);
    }

    return app;
  },

  importFastBootDependencies: function(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    var vendor = this.treePaths.vendor;

    app.import(vendor + '/fastboot-moment.js');
  },

  importBrowserDependencies: function(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    var vendor = this.treePaths.vendor;
    var options = this.momentOptions;

    if (options.includeTimezone) {
      app.import({
        development: vendor + '/moment-timezone/tz.js',
        production: vendor + '/moment-timezone/tz.min.js'
      }, { prepend: true });
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      app.import({
        development: vendor + '/moment/min/moment-with-locales.js',
        production: vendor + '/moment/min/moment-with-locales.min.js'
      }, { prepend: true });
    }
    else {
      if (Array.isArray(options.includeLocales)) {
        options.includeLocales.map(function(locale) {
          app.import(vendor + '/moment/locales/' + locale + '.js', { prepend: true });
        });
      }

      app.import({
        development: vendor + '/moment/moment.js',
        production: vendor + '/moment/min/moment.min.js'
      }, { prepend: true });
    }
  },

  getConfig: function() {
    var projectConfig = ((this.project.config(process.env.EMBER_ENV) || {}).moment || {});
    var momentPath = path.dirname(require.resolve('moment'));

    var config = defaults(projectConfig, {
      momentPath: momentPath,
      includeTimezone: null,
      includeLocales: []
    });

    if (Array.isArray(config.includeLocales)) {
      config.includeLocales = config.includeLocales.filter(function(locale) {
        return typeof locale === 'string';
      }).map(function(locale) {
        return locale.replace('.js', '').trim().toLowerCase();
      }).filter(function(locale) {
        if (locale === 'en') {
          // `en` is included by default.  quietly ignore if user specifies it in the list
          return false;
        }

        if (!existsSync(momentPath + '/locale/' + locale + '.js')) {
          console.log(chalk.red('ember-moment: Specified locale `' + locale + '` but could not find in moment/locale.\nVisit https://github.com/moment/moment/tree/master/locale to view the full list of supported locales.'));
          return false;
        }

        return true;
      });
    }

    return config;
  },

  treeForPublic: function() {
    var publicTree = this._super.treeForPublic.apply(this, arguments);

    if (isFastBoot()) {
      return publicTree;
    }

    var options = this.momentOptions;
    var trees = [];

    if (publicTree) {
      trees.push(publicTree);
    }

    if (options.localeOutputPath) {
      trees.push(new Funnel(options.momentPath, {
        srcDir: 'locale',
        destDir: options.localeOutputPath
      }));
    }

    return mergeTrees(trees);
  },

  treeForVendor: function(vendorTree) {
    if (isFastBoot()) {
      return this.treeForNodeVendor(vendorTree);
    } else {
      return this.treeForBrowserVendor(vendorTree);
    }
  },

  treeForNodeVendor: function(vendorTree) {
    var trees = [];
    var options = this.momentOptions;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    var fileName;
    if (options.includeTimezone) {
      // includes all of moment.js
      fileName = 'fastboot-moment-timezone.js';
    } else {
      fileName = 'fastboot-moment.js';
    }

    var tree = new Funnel(path.join(__dirname, './assets'), {
      files: [fileName],
    });

    tree = rename(tree, function() {
      return 'fastboot-moment.js';
    });

    trees.push(tree);

    return mergeTrees(trees);
  },

  treeForBrowserVendor: function(vendorTree) {
    var trees = [];
    var options = this.momentOptions;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(new Funnel(options.momentPath, {
      destDir: 'moment',
      include: [new RegExp(/\.js$/)],
      exclude: ['tests', 'ender', 'package'].map(function(key) {
        return new RegExp(key + '\.js$');
      })
    }));

    if (Array.isArray(options.includeLocales) && options.includeLocales.length) {
      var localeTree = new Funnel(options.momentPath, {
        srcDir: 'locale',
        destDir: 'moment/locales',
        include: options.includeLocales.map(function(locale) {
          return new RegExp(locale + '.js$');
        })
      });

      trees.push(localeTree);
    }

    if (options.includeTimezone) {
      var momentTimezonePath = path.dirname(require.resolve('moment-timezone'));
      var timezonePath;
      var timezoneMinPath;

      switch(options.includeTimezone) {
        case 'all':
          timezonePath = 'builds/moment-timezone-with-data.js';
          timezoneMinPath = 'builds/moment-timezone-with-data.min.js';
          break;
        case '2010-2020':
          timezonePath = 'builds/moment-timezone-with-data-2010-2020.js';
          timezoneMinPath = 'builds/moment-timezone-with-data-2010-2020.min.js';
          break;
        case 'none':
          timezonePath = 'moment-timezone.js';
          timezoneMinPath = 'builds/moment-timezone.min.js';
          break;
        default:
          throw new Error('ember-moment: Please specify the moment-timezone dataset to include as either "all", "2010-2020", or "none".');
      }

      trees.push(rename(new Funnel(momentTimezonePath, {
        files: [timezonePath]
      }), function(/*filepath*/) {
        return 'moment-timezone/tz.js';
      }));

      trees.push(rename(new Funnel(momentTimezonePath, {
        files: [timezoneMinPath]
      }), function(/*filepath*/) {
        return 'moment-timezone/tz.min.js';
      }));
    }

    return mergeTrees(trees);
  }
};

// Checks to see whether this build is targeting FastBoot. Note that we cannot
// check this at boot time--the environment variable is only set once the build
// has started, which happens after this file is evaluated.
function isFastBoot() {
  return process.env.EMBER_CLI_FASTBOOT === 'true';
}
