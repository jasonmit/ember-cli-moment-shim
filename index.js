/* globals require, module, process */
/* eslint no-fallthrough: 0, no-duplicate-case: 0 */

'use strict';

const UnwatchedDir = require('broccoli-source').UnwatchedDir;
// const mergeTrees = require('broccoli-merge-trees');
const defaults = require('lodash.defaults');
// const funnel = require('broccoli-funnel');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const IgnorePlugin = webpack.IgnorePlugin;
const ContextReplacementPlugin = webpack.ContextReplacementPlugin;

module.exports = {
  name: 'ember-cli-moment-shim',

  options: {
    autoImport: {
      alias: {},
      webpack: {
        plugins: [],
      },
    },
  },

  included() {
    this._super.included.apply(this, arguments);
    this._options = this.getOptions();
    this.momentNode = new UnwatchedDir(this._options.momentPath);
    this.importDependencies();
  },

  // updateFastBootManifest(manifest) {
  //   let target = 'fastboot-moment.js';

  //   if (this._options.includeTimezone) {
  //     target = 'fastboot-moment-timezone.js';
  //   }

  //   manifest.vendorFiles.push('moment/' + target);

  //   return manifest;
  // },

  importDependencies() {
    let options = this._options;
    const autoImport = this.options.autoImport;
    if (options.includeTimezone) {
      const tzPath = this._getMomentTZImportPath(options.includeTimezone);

      autoImport.alias['moment-timezone'] = tzPath.dev;
      autoImport.webpack.plugins.push(new IgnorePlugin(/^\.\/data$/, /moment-timezone$/));
    }

    if (typeof options.includeLocales === 'boolean' && options.includeLocales) {
      autoImport.alias['moment'] = 'moment/min/moment-with-locales';
      autoImport.webpack.plugins.push(new IgnorePlugin(/^\.\/locale$/, /moment$/));
    } else {
      if (Array.isArray(options.includeLocales)) {
        var regExpPatterns = options.includeLocales.map(function(localeName) {
            return localeName + '(\\.js)?';
        });
        const localesRegex = new RegExp('(' + regExpPatterns.join('|') + ')$');
        autoImport.webpack.plugins.push(new ContextReplacementPlugin(
          /moment[/\\]locale$/,
          localesRegex
        ));
      }
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

  // treeForPublic() {
  //   let hasFastBoot = this.project.addons.some(
  //     addon => addon.name === 'ember-cli-fastboot'
  //   );
  //   let publicTree = this._super.treeForPublic.apply(this, arguments);
  //   let options = this._options;
  //   let trees = [];

  //   if (publicTree && hasFastBoot) {
  //     trees.push(publicTree);
  //   }

  //   if (options.localeOutputPath) {
  //     trees.push(
  //       funnel(this.momentNode, {
  //         srcDir: 'locale',
  //         destDir: options.localeOutputPath
  //       })
  //     );
  //   }

  //   return mergeTrees(trees);
  // },

  _getMomentTZImportPath(includeTimezone) {
    const paths = {
      dev: null,
      prod: null,
    };
    const currentSubset = '2012-2022'; // TODO: make this dynamic
    switch (includeTimezone) {
      case 'all':
        paths.dev = 'moment-timezone/builds/moment-timezone-with-data';
        paths.prod = 'moment-timezone/builds/moment-timezone-with-data.min';
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
        paths.dev = 'moment-timezone/builds/moment-timezone-with-data-' + currentSubset + '';
        paths.prod = 'moment-timezone/builds/moment-timezone-with-data-' + currentSubset + '.min';
        break;
      case 'none':
        paths.dev = 'moment-timezone/moment-timezone';
        paths.prod = 'moment-timezone/builds/moment-timezone.min';
        break;
      default:
        throw new Error(
          'ember-cli-moment-shim: Please specify the moment-timezone dataset to include as either "all", "subset", or "none".'
        );
    }
    return paths;
  },
};
