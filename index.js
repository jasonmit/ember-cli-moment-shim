/* globals require, module, process */
/* eslint no-fallthrough: 0, no-duplicate-case: 0 */

'use strict';

const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const mergeTrees = require('broccoli-merge-trees');
const defaults = require('lodash.defaults');
const funnel = require('broccoli-funnel');
const existsSync = require('exists-sync');
const stew = require('broccoli-stew');
const chalk = require('chalk');
const path = require('path');
const rename = stew.rename;
const map = stew.map;

module.exports = {
  name: 'moment',

  included() {
    this._super.included.apply(this, arguments);
    this._options = this.getOptions();
    this.fastbootTarget = 'fastboot-moment.js';

    if (this._options.includeTimezone) {
      this.fastbootTarget = 'fastboot-moment-timezone.js'
    }

    this.importDependencies();
  },

  updateFastBootManifest(manifest) {
    manifest.vendorFiles.push('moment/' + this.fastbootTarget);

    return manifest;
  },

  importDependencies() {
    let vendor = this.treePaths.vendor;
    let options = this._options;

    if (options.includeTimezone) {
      this.import(
        {
          development: vendor + '/moment-timezone/tz.js',
          production: vendor + '/moment-timezone/tz.min.js'
        },
        { prepend: true }
      );
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      this.import(
        {
          development: vendor + '/moment/min/moment-with-locales.js',
          production: vendor + '/moment/min/moment-with-locales.min.js'
        },
        { prepend: true }
      );
    } else {
      if (Array.isArray(options.includeLocales)) {
        options.includeLocales.forEach(locale => {
          this.import(vendor + '/moment/locales/' + locale + '.js', { prepend: true });
        });
      }

      this.import(
        {
          development: vendor + '/moment/moment.js',
          production: vendor + '/moment/min/moment.min.js'
        },
        { prepend: true }
      );
    }
  },

  getOptions() {
    let projectConfig = (this.project.config(process.env.EMBER_ENV) || {}).moment || {};
    let momentPath = path.dirname(require.resolve('moment'));

    let config = defaults(projectConfig, {
      momentPath: momentPath,
      includeTimezone: null,
      includeLocales: []
    });

    if (Array.isArray(config.includeLocales)) {
      config.includeLocales = config.includeLocales
        .filter(locale => typeof locale === 'string')
        .map(locale => locale.replace('.js', '').trim().toLowerCase())
        .filter(locale => {
          if (locale === 'en') {
            // `en` is included by default.  quietly ignore if user specifies it in the list
            return false;
          }

          if (!existsSync(momentPath + '/locale/' + locale + '.js')) {
            this.ui.writeLine(
              chalk.red(
                'ember-cli-moment-shim: Specified locale `' +
                  locale +
                  '` but could not find in moment/locale.\nVisit https://github.com/moment/moment/tree/master/locale to view the full list of supported locales.'
              )
            );
            return false;
          }

          return true;
        });
    }

    return config;
  },

  treeForPublic() {
    let publicTree = this._super.treeForPublic.apply(this, arguments);
    let options = this._options;
    let trees = [];

    if (publicTree) {
      trees.push(publicTree);
    }

    if (options.localeOutputPath) {
      trees.push(
        funnel(new UnwatchedDir(options.momentPath), {
          srcDir: 'locale',
          destDir: options.localeOutputPath
        })
      );
    }

    return mergeTrees(trees);
  },

  treeForVendor(vendorTree) {
    return this.treeForBrowserVendor(vendorTree);
  },

  treeForBrowserVendor(vendorTree) {
    let trees = [];
    let options = this._options;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(
      funnel(new UnwatchedDir(options.momentPath), {
        destDir: 'moment',
        include: [new RegExp(/\.js$/)],
        exclude: ['tests', 'ender', 'package'].map(key => new RegExp(key + '\.js$'))
      })
    );

    if (Array.isArray(options.includeLocales) && options.includeLocales.length) {
      let localeTree = funnel(new UnwatchedDir(options.momentPath), {
        srcDir: 'locale',
        destDir: 'moment/locales',
        include: options.includeLocales.map(locale => new RegExp(locale + '.js$'))
      });

      trees.push(localeTree);
    }

    if (options.includeTimezone) {
      let timezonePath;
      let timezoneMinPath;

      switch (options.includeTimezone) {
        case 'all':
          timezonePath = 'builds/moment-timezone-with-data.js';
          timezoneMinPath = 'builds/moment-timezone-with-data.min.js';
          break;
        case '2010-2020':
          this.ui.writeLine(
            chalk.yellow(
              '[ember-cli-moment-shim] "2010-2020" is deprecated, use "subset" within config/environment\nDiscussion: https://github.com/jasonmit/ember-cli-moment-shim/issues/121'
            )
          );
        case 'subset':
        case '2012-2022':
        case '2010-2020':
          timezonePath = 'builds/moment-timezone-with-data-*.js';
          timezoneMinPath = 'builds/moment-timezone-with-data-*.min.js';
          break;
        case 'none':
          timezonePath = 'moment-timezone.js';
          timezoneMinPath = 'builds/moment-timezone.min.js';
          break;
        default:
          throw new Error(
            'ember-cli-moment-shim: Please specify the moment-timezone dataset to include as either "all", "subset", or "none".'
          );
      }

      const timezoneDir = new UnwatchedDir(path.dirname(require.resolve('moment-timezone')));

      trees.push(
        rename(
          funnel(timezoneDir, { include: [timezonePath] }),
          () => 'moment-timezone/tz.js'
        )
      );

      trees.push(
        rename(
          funnel(timezoneDir, { include: [timezoneMinPath] }),
          () => 'moment-timezone/tz.min.js'
        )
      );
    }

    return map(mergeTrees(trees), (content) => `if (typeof FastBoot === 'undefined') { ${content} }`);
  }
};
