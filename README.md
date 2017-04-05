# ember-cli-moment-shim
[![Build Status](https://travis-ci.org/jasonmit/ember-cli-moment-shim.svg?branch=master)](https://travis-ci.org/jasonmit/ember-cli-moment-shim)
[![npm Version][npm-badge]][npm]
[![Ember Observer Score](http://emberobserver.com/badges/ember-cli-moment-shim.svg)](http://emberobserver.com/addons/ember-cli-moment-shim)
[![Ember badge][ember-badge]][embadge]

ES6 accessible module for momentjs within your Ember applications.

## Usage

* `ember install ember-cli-moment-shim`

```js
import moment from 'moment';
```

## Features

* ES6 accessible module for moment
* Convient way to bring in locales & timezones through configuration
* FastBoot support

## Upgrading

Be sure to rerun the default blueprint with `ember g ember-cli-moment-shim` if upgrading by bumping the version number in package.json.

## Enabling moment-timezone

```js
// config.environment.js
module.exports = function(environment) {
  return {
    moment: {
      // Options:
      // 'all' - all years, all timezones
      // 'subset' - subset of the timezone data to cover 2010-2020 (or 2012-2022 as of 0.5.12). all timezones.
      // 'none' - no data, just timezone API
      includeTimezone: 'all'
    }
  };
}
```

## i18n support

### Cherry pick locales (optimal)

```js
// config.environment.js
module.exports = function(environment) {
  return {
    moment: {
      // To cherry-pick specific locale support into your application.
      // Full list of locales: https://github.com/moment/moment/tree/2.10.3/locale
      includeLocales: ['es', 'fr-ca']
    }
  };
```

*NOTE: English is bundled automatically, not need to add `en` in `includeLocales`*

### Include all locales

```js
// config.environment.js
module.exports = function(environment) {
  return {
    moment: {
      includeLocales: true
    }
  };
```

### Configure default runtime locale

```js
// app/routes/applicaton.js
import moment from 'moment';

export default Ember.Route.extend({
  beforeModel() {
    // sets the application locale to Spanish
    moment.locale('es');
  }
});
```

### Write all the locales to a folder relative to `dist`

```js
// config.environment.js
module.exports = function(environment) {
  return {
    moment: {
      // This will output _all_ locale scripts to assets/moment-locales
      // this option does not respect includeLocales
      localeOutputPath: 'assets/moment-locales'
    }
  };
```

Feature set of i18n support within moment can be found here:  http://momentjs.com/docs/#/i18n/

## License

ember-cli-moment-shim shims is [MIT Licensed](https://github.com/jasonmit/ember-cli-moment-shim/blob/master/LICENSE.md).

[embadge]: http://embadge.io/
[ember-badge]: http://embadge.io/v1/badge.svg?start=1.0.0
[npm]: https://www.npmjs.org/package/ember-cli-moment-shim
[npm-badge]: https://img.shields.io/npm/v/ember-cli-moment-shim.svg?style=flat-square
