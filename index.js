/* globals require, module, process */
/* eslint no-fallthrough: 0, no-duplicate-case: 0 */

'use strict';

const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const mergeTrees = require('broccoli-merge-trees');
const funnel = require('broccoli-funnel');
const existsSync = require('exists-sync');
const stew = require('broccoli-stew');
const path = require('path');

const rename = stew.rename;
const map = stew.map;

module.exports = {
  name: 'moment',

  included() {
    this._super.included.apply(this, arguments);
    this.context = this.buildContext();
    this.momentNode = new UnwatchedDir(this.context.momentPath);
    this.importDependencies(this.context);
  },

  findModulePath(moduleName) {
    try {
      let basedir = this.project.root;
      let resolve = require('resolve');

      return path.dirname(resolve.sync(moduleName, { basedir: basedir }));
    } catch (_) {
      try {
        return path.dirname(require.resolve(moduleName));
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          this.ui.writeLine(
            `ember-cli-moment-shim: ${moduleName} not installed.  Try resolving via "npm install ${moduleName}".`
          );
          return;
        }

        throw e;
      }
    }
  },

  updateFastBootManifest(manifest) {
    let target = 'fastboot-moment.js';

    if (this.context.includeTimezone) {
      target = 'fastboot-moment-timezone.js';
    }

    manifest.vendorFiles.push('moment/' + target);

    return manifest;
  },

  importDependencies(context) {
    if (context.includeTimezone) {
      this.import(
        {
          development: 'vendor/moment-timezone/tz.js',
          production: 'vendor/moment-timezone/tz.min.js'
        },
        { prepend: true }
      );
    }

    if (typeof context.includeLocales === 'boolean' && context.includeLocales) {
      this.import(
        {
          development: 'vendor/moment/min/moment-with-locales.js',
          production: 'vendor/moment/min/moment-with-locales.min.js'
        },
        { prepend: true }
      );
    } else {
      if (this.hasLocales(context)) {
        context.includeLocales.forEach(locale => {
          this.import('vendor/moment/locales/' + locale + '.js', { prepend: true });
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

  writeLine(msg, color = 'yellow') {
    let chalk = require('chalk');
    this.ui.writeLine(chalk[color](msg));
  },

  hasLocales(context) {
    return Array.isArray(context.includeLocales);
  },

  buildContext() {
    let projectConfig = (this.project.config(process.env.EMBER_ENV) || {}).moment || {};
    let momentPath = this.findModulePath('moment');

    let context = Object.assign({
      momentPath: momentPath,
      includeTimezone: null,
      includeLocales: []
    }, projectConfig);

    if (this.hasLocales(context)) {
      context.includeLocales = context.includeLocales
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

          if (!existsSync(momentPath + '/locale/' + locale + '.js')) {
            this.writeLine(
              'ember-cli-moment-shim: Specified locale `' +
                locale +
                '` but could not find in moment/locale.\nVisit https://github.com/moment/moment/tree/master/locale to view the full list of supported locales.',
              'red'
            );
            return false;
          }

          return true;
        });
    }

    return context;
  },

  treeForPublic() {
    let hasFastBoot = this.project.addons.some(addon => addon.name === 'ember-cli-fastboot');
    let publicTree = this._super.treeForPublic.apply(this, arguments);
    let context = this.context;
    let trees = [];

    if (publicTree && hasFastBoot) {
      trees.push(publicTree);
    }

    if (context.localeOutputPath) {
      trees.push(
        funnel(this.momentNode, {
          srcDir: 'locale',
          destDir: context.localeOutputPath
        })
      );
    }

    return mergeTrees(trees);
  },

  pathsForOptions({ includeTimezone }) {
    switch (includeTimezone) {
      case 'all':
        return ['builds/moment-timezone-with-data.js', 'builds/moment-timezone-with-data.min.js'];
      case '2010-2020':
        this.writeLine('[ember-cli-moment-shim] "2010-2020" is deprecated, use "subset" within config/environment\nDiscussion: https://github.com/jasonmit/ember-cli-moment-shim/issues/121');
      case 'subset':
      case '2012-2022':
      case '2010-2020':
        return ['builds/moment-timezone-with-data-*.js', 'builds/moment-timezone-with-data-*.min.js'];
      case 'none':
        return ['moment-timezone.js', 'builds/moment-timezone.min.js'];
      default:
        throw new Error(
          'ember-cli-moment-shim: Please specify the moment-timezone dataset to include as either "all", "subset", or "none".'
        );
    }
  },

  treeForVendor(vendorTree) {
    let trees = [];
    let context = this.context;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(
      funnel(this.momentNode, {
        destDir: 'moment',
        include: [new RegExp(/\.js$/)],
        exclude: ['tests', 'ender', 'package'].map(key => new RegExp(key + '.js$'))
      })
    );

    if (this.hasLocales(context) && context.includeLocales.length) {
      let localeTree = funnel(this.momentNode, {
        srcDir: 'locale',
        destDir: 'moment/locales',
        include: context.includeLocales.map(locale => new RegExp(locale + '.js$'))
      });

      trees.push(localeTree);
    }

    if (context.includeTimezone) {
      let [timezonePath, timezoneMinPath] = this.pathsForOptions(context);
      let timezoneNode = new UnwatchedDir(this.findModulePath('moment-timezone'));

      trees.push(rename(funnel(timezoneNode, { include: [timezonePath] }), () => 'moment-timezone/tz.js'));

      trees.push(rename(funnel(timezoneNode, { include: [timezoneMinPath] }), () => 'moment-timezone/tz.min.js'));
    }

    return map(mergeTrees(trees), content => `if (typeof FastBoot === 'undefined') { ${content} }`);
  }
};
