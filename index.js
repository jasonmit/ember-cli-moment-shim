'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var defaults = require('lodash.defaults');
var rename = require('broccoli-stew').rename;
var existsSync = require('exists-sync');
var chalk = require('chalk');

module.exports = {
  name: 'moment',

  included: function(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    if (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    this.app = app;
    this.options = this.getConfig();
    this.importDependencies(app);
  },

  importDependencies: function(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    var vendor = this.treePaths.vendor;
    var options = this.options;

    if (options.includeTimezone) {
      app.import(path.join(vendor, 'moment-timezone', 'tz.js'), { prepend: true });
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      app.import(path.join(vendor, 'moment', 'min', 'moment-with-locales.min.js'), { prepend: true });
    }
    else {
      if (Array.isArray(options.includeLocales)) {
        options.includeLocales.map(function(locale) {
          app.import(path.join(vendor, 'moment', 'locales', locale + '.js'), { prepend: true })
        });
      }
      app.import(path.join(vendor, 'moment', 'min', 'moment.min.js'), { prepend: true });
    }
  },

  getConfig: function() {
    var projectConfig = ((this.project.config(process.env.EMBER_ENV) || {}).moment || {});
    var momentPath = path.join(this.project.bowerDirectory, 'moment');

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

        if (!existsSync(path.join(momentPath, 'locale', locale + '.js'))) {
          console.log(chalk.red('ember-moment: Specified locale `' + locale + '` but could not find in moment/locale.\nVisit https://github.com/moment/moment/tree/master/locale to view the full list of supported locales.'));
          return false;
        }

        return true;
      });
    }

    return config;
  },

  treeForVendor: function(vendorTree) {
    var trees = [];
    var options = this.options;

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
        destDir: path.join('moment', 'locales'),
        include: options.includeLocales.map(function(locale) {
          return new RegExp(locale + '.js$');
        })
      });

      trees.push(localeTree);
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
          throw new Error("ember-moment: Please specify the moment-timezone dataset to include as either 'all', '2010-2020', or 'none'.");
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
