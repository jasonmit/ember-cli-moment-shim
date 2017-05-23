'use strict';

const mergeTrees = require('broccoli-merge-trees');
const rename = require('broccoli-stew').rename;
const defaults = require('lodash.defaults');
const funnel = require('broccoli-funnel');
const existsSync = require('exists-sync');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Checks to see whether this build is targeting FastBoot. Note that we cannot
// check this at boot time--the environment variable is only set once the build
// has started, which happens after this file is evaluated.
function legacyIsFastboot() {
  return process.env.EMBER_CLI_FASTBOOT === 'true';
}

module.exports = {
  name: 'moment',

  included(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    this.app = app;
    this.momentOptions = this.getConfig();

    if (legacyIsFastboot()) {
      this.importFastBootDependencies(app);
    } else {
      this.importBrowserDependencies(app);
    }

    return app;
  },

  importFastBootDependencies(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    app.import(this.treePaths.vendor + '/fastboot-moment.js');
  },

  importBrowserDependencies(app) {
    if (arguments.length < 1) {
      throw new Error('Application instance must be passed to import');
    }

    let vendor = this.treePaths.vendor;
    let options = this.momentOptions;

    if (options.includeTimezone) {
      app.import(
        {
          development: vendor + '/moment-timezone/tz.js',
          production: vendor + '/moment-timezone/tz.min.js'
        },
        { prepend: true }
      );
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      app.import(
        {
          development: vendor + '/moment/min/moment-with-locales.js',
          production: vendor + '/moment/min/moment-with-locales.min.js'
        },
        { prepend: true }
      );
    } else {
      if (Array.isArray(options.includeLocales)) {
        options.includeLocales.forEach(locale => {
          app.import(vendor + '/moment/locales/' + locale + '.js', { prepend: true });
        });
      }

      app.import(
        {
          development: vendor + '/moment/moment.js',
          production: vendor + '/moment/min/moment.min.js'
        },
        { prepend: true }
      );
    }
  },

  getConfig() {
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
            console.log(
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

  treeForPublic(publicTree) {
    if (legacyIsFastboot()) {
      return publicTree;
    }

    let options = this.momentOptions;
    let trees = [];

    if (publicTree) {
      trees.push(publicTree);
    }

    if (options.localeOutputPath) {
      trees.push(
        funnel(options.momentPath, {
          srcDir: 'locale',
          destDir: options.localeOutputPath
        })
      );
    }

    return mergeTrees(trees);
  },

  treeForVendor(vendorTree) {
    if (legacyIsFastboot()) {
      return this.treeForNodeVendor(vendorTree);
    }

    return this.treeForBrowserVendor(vendorTree);
  },

  treeForNodeVendor(vendorTree) {
    let trees = [];
    let options = this.momentOptions;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    let fileName;
    if (options.includeTimezone) {
      // includes all of moment.js
      fileName = 'fastboot-moment-timezone.js';
    } else {
      fileName = 'fastboot-moment.js';
    }

    let tree = funnel(path.join(__dirname, './assets'), {
      files: [fileName]
    });

    tree = rename(tree, () => 'fastboot-moment.js');
    trees.push(tree);

    return mergeTrees(trees);
  },

  contentFor(type) {
    if (type === 'app-boot') {
      let fileName = 'fastboot-moment.js';

      if (this.momentOptions.includeTimezone) {
        // includes all of moment.js
        fileName = 'fastboot-moment-timezone.js';
      }

      return fs.readFileSync(path.join(__dirname, 'assets', fileName), 'utf8');
    }
  },

  treeForBrowserVendor(vendorTree) {
    let trees = [];
    let options = this.momentOptions;

    if (vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(
      funnel(options.momentPath, {
        destDir: 'moment',
        include: [new RegExp(/\.js$/)],
        exclude: ['tests', 'ender', 'package'].map(key => new RegExp(key + '\.js$'))
      })
    );

    if (Array.isArray(options.includeLocales) && options.includeLocales.length) {
      let localeTree = funnel(options.momentPath, {
        srcDir: 'locale',
        destDir: 'moment/locales',
        include: options.includeLocales.map(locale => new RegExp(locale + '.js$'))
      });

      trees.push(localeTree);
    }

    if (options.includeTimezone) {
      let momentTimezonePath = path.dirname(require.resolve('moment-timezone'));
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

      trees.push(
        rename(
          funnel(momentTimezonePath, { include: [timezonePath] }),
          () => 'moment-timezone/tz.js'
        )
      );

      trees.push(
        rename(
          funnel(momentTimezonePath, { include: [timezoneMinPath] }),
          () => 'moment-timezone/tz.min.js'
        )
      );
    }

    return mergeTrees(trees);
  }
};
