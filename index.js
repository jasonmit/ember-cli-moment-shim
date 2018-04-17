/* globals require, module, process */
/* eslint no-fallthrough: 0, no-duplicate-case: 0 */

'use strict';

const UnwatchedDir = require('broccoli-source').UnwatchedDir;
const mergeTrees = require('broccoli-merge-trees');
const defaults = require('lodash.defaults');
const funnel = require('broccoli-funnel');
const concat = require('broccoli-concat');
const stew = require('broccoli-stew');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const rename = stew.rename;
const map = stew.map;

function getLocaleDefinitionModules(requestingTree) {
  let options = this._options;
  const singleModule = options.singleModule;

  if (requestingTree === 'addon' && !singleModule) {
    return;
  }

  if (requestingTree === 'vendor' && singleModule) {
    return;
  }

  let localeTree;
  if (
    Array.isArray(options.includeLocales) &&
    options.includeLocales.length
  ) {
    localeTree = funnel(this.momentNode, {
      srcDir: 'locale',
      destDir: 'moment/locales',
      include: options.includeLocales.map(
        locale => new RegExp(locale + '.js$')
      )
    });
  }

  if (singleModule) {
    // Turn the locales into a hash key/value pairs.
    const keyValuePairs = map(localeTree, function(content, relativePath) {
      const locale = path.basename(relativePath, '.js');
      return `'${locale}': function() { ${content} },`;
    });

    // This function becomes defineLocale(locale);
    const header = `
      export default function(locale) {
        if (typeof FastBoot === 'undefined') {
          const locales = {
    `;
    const footer = `
          };

          if (locales[locale]) {
            locales[locale]();
          }
        }
      }
    `;

    const concatenatedDefinitionIIFEs = concat(keyValuePairs, {
      header,
      footer,
      inputFiles: ['**/*'],
      outputFile: 'ember-cli-moment-shim/define-locale.js'
    });

    let babelAddon = this.addons.find(addon => addon.name === 'ember-cli-babel');
    return babelAddon.transpileTree(concatenatedDefinitionIIFEs);
  } else {
    return map(
      localeTree,
      content => `if (typeof FastBoot === 'undefined') { ${content} }`
    );
  }
}

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
      if (Array.isArray(options.includeLocales) && !options.singleModule) {
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
      singleModule: false,
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

  treeForAddon() {
    const superValue = this._super.apply(this, arguments);
    const definitionModules = getLocaleDefinitionModules.call(this, 'addon');
    return mergeTrees([superValue, definitionModules].filter(Boolean));
  },

  treeForVendor() {
    let trees = [];
    let options = this._options;

    const superValue = this._super.apply(this, arguments);
    trees.push(superValue);

    trees.push(
      funnel(this.momentNode, {
        destDir: 'moment',
        include: [new RegExp(/\.js$/)],
        exclude: ['tests', 'ender', 'package'].map(
          key => new RegExp(key + '.js$')
        )
      })
    );

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

    const definitionModules = getLocaleDefinitionModules.call(this, 'vendor');
    trees.push(definitionModules);

    return map(
      mergeTrees(trees.filter(Boolean)),
      content => `if (typeof FastBoot === 'undefined') { ${content} }`
    );
  }
};
