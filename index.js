/*jshint node:true*/

'use strict';

require('ember-cli-import-polyfill');

var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var defaults = require('lodash.defaults');
var rename = require('broccoli-stew').rename;
var existsSync = require('exists-sync');
var chalk = require('chalk');
var path = require('path');

module.exports = {
  name: 'moment',

  included: function() {
    this._super.included.apply(this, arguments);

    this.momentOptions = this.getConfig();

    if (isFastBoot()) {
      this.importFastBootDependencies();
    } else {
      this.importBrowserDependencies();
    }
  },

  importFastBootDependencies: function() {
    this.import("vendor/fastboot-moment-timezone.js");
  },

  importBrowserDependencies: function() {
    var vendor = this.treePaths.vendor;
    var options = this.momentOptions;

    if (options.includeTimezone) {
      this.import(vendor + '/moment-timezone/tz.js', { prepend: true });
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      this.import(vendor + '/moment/min/moment-with-locales.min.js', { prepend: true });
    }
    else {
      if (Array.isArray(options.includeLocales)) {
        var addon = this;
        options.includeLocales.map(function(locale) {
          addon.import(vendor + '/moment/locales/' + locale + '.js', { prepend: true });
        });
      }

      this.import(vendor + '/moment/min/moment.min.js', { prepend: true });
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

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(new Funnel(path.join(__dirname, './assets'), {
      files: ['fastboot-moment-timezone.js'],
    }));

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
      var timezonePath = [momentTimezonePath, 'builds'];

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
          throw new Error("ember-moment: Please specify the moment-timezone dataset to include as either 'all', '2010-2020', or 'none'.");
      }

      trees.push(rename(new Funnel(momentTimezonePath + '/builds', {
        files: [timezonePath[timezonePath.length - 1]]
      }), function(/*filepath*/) {
        return 'moment-timezone/tz.js';
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
