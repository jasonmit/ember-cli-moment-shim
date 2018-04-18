/* globals require, module, process */
/* eslint no-fallthrough: 0, no-duplicate-case: 0 */

'use strict';

const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const mergeTrees = require('broccoli-merge-trees');
const defaults = require('lodash.defaults');
const funnel = require('broccoli-funnel');
const stew = require('broccoli-stew');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const rename = stew.rename;
const map = stew.map;

module.exports = {
  name: 'moment',

  included() {
    this._super.included.apply(this, arguments);
    this._options = this.getOptions();
    this.momentNode = new UnwatchedDir(this._options.momentPath);
    this.importDependencies();
  },

  updateFastBootManifest(manifest) {
    let target = 'fastboot-moment.js';

    if (this._options.includeTimezone) {
      target = 'fastboot-moment-timezone.js';
    }

    manifest.vendorFiles.push('moment/' + target);

    return manifest;
  },

  importDependencies() {
    let options = this._options;

    if (options.includeTimezone) {
      this.import(
        {
          development: 'vendor/moment-timezone/tz.js',
          production: 'vendor/moment-timezone/tz.min.js'
        },
        { prepend: true }
      );
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      this.import(
        {
          development: 'vendor/moment/min/moment-with-locales.js',
          production: 'vendor/moment/min/moment-with-locales.min.js'
        },
        { prepend: true }
      );
    } else {
      if (Array.isArray(options.includeLocales)) {
        options.includeLocales.forEach(locale => {
          this.import('vendor/moment/locales/' + locale + '.js', {
            prepend: true
          });
        });
      }

      this.import(
        {
          development: 'vendor/moment/moment.js',
          production: 'vendor/moment/min/moment.min.js'
        },
        { prepend: true }
      );
    }
  },

  getOptions() {
    let projectConfig =
      (this.project.config(process.env.EMBER_ENV) || {}).moment || {};
    let momentPath = path.dirname(require.resolve('moment'));
    let config = defaults(projectConfig, {
      momentPath: momentPath,
      includeTimezone: null,
      includeLocales: []
    });

    if (Array.isArray(config.includeLocales)) {
      config.includeLocales = config.includeLocales
        .filter(locale => typeof locale === 'string')
        .map(locale =>
          locale
            .replace('.js', '')
            .trim()
            .toLowerCase()
        )
        .filter(locale => {
          if (locale === 'en') {
            // `en` is included by default.  quietly ignore if user specifies it in the list
            return false;
          }

          if (!fs.existsSync(momentPath + '/locale/' + locale + '.js')) {
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
    let hasFastBoot = this.project.addons.some(
      addon => addon.name === 'ember-cli-fastboot'
    );
    let publicTree = this._super.treeForPublic.apply(this, arguments);
    let options = this._options;
    let trees = [];

    if (publicTree && hasFastBoot) {
      trees.push(publicTree);
    }

    if (options.localeOutputPath) {
      trees.push(
        funnel(this.momentNode, {
          srcDir: 'locale',
          destDir: options.localeOutputPath
        })
      );
    }

    return mergeTrees(trees);
  },

  treeForVendor(vendorTree) {
    let trees = [];
    let options = this._options;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(
      funnel(this.momentNode, {
        destDir: 'moment',
        include: [new RegExp(/\.js$/)],
        exclude: ['tests', 'ender', 'package'].map(
          key => new RegExp(key + '.js$')
        )
      })
    );

    if (
      Array.isArray(options.includeLocales) &&
      options.includeLocales.length
    ) {
      let localeTree = funnel(this.momentNode, {
        srcDir: 'locale',
        destDir: 'moment/locales',
        include: options.includeLocales.map(
          locale => new RegExp(locale + '.js$')
        )
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

      const timezoneNode = new UnwatchedDir(
        path.dirname(require.resolve('moment-timezone'))
      );

      trees.push(
        rename(
          funnel(timezoneNode, { include: [timezonePath] }),
          () => 'moment-timezone/tz.js'
        )
      );

      trees.push(
        rename(
          funnel(timezoneNode, { include: [timezoneMinPath] }),
          () => 'moment-timezone/tz.min.js'
        )
      );
    }

    return map(
      mergeTrees(trees),
      content => `if (typeof FastBoot === 'undefined') { ${content} }`
    );
  }
};
