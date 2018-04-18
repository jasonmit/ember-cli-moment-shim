# ember-cli-moment-shim
[![Build Status](https://travis-ci.org/jasonmit/ember-cli-moment-shim.svg?branch=master)](https://travis-ci.org/jasonmit/ember-cli-moment-shim)
[![npm Version][npm-badge]][npm]
[![Ember Observer Score](http://emberobserver.com/badges/ember-cli-moment-shim.svg)](http://emberobserver.com/addons/ember-cli-moment-shim)

ember-cli ES6 module shim for [momentjs](https://momentjs.com) and [moment timezone](https://momentjs.com/timezone/) within your Ember applications.  It will also conditionally bundle in specific locale/timezone data for those concerned about payload size.

## Usage

* `ember install ember-cli-moment-shim`

```js
import moment from 'moment';
```

## Features

* ES6 accessible module for moment
* Trim your build sizes by bundling locale & timezone data through simple configuration
* FastBoot support

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
      // Full list of locales: https://github.com/moment/moment/tree/master/locale
      includeLocales: ['es', 'fr-ca']
    }
  };
```

*NOTE: English is bundled automatically – no need to add `en` in `includeLocales`*

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

### Write all locales to a folder that is relative to `dist`

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

The feature set for i18n support within moment can be found here:  http://momentjs.com/docs/#/i18n/

## License

ember-cli-moment-shim shims is [MIT Licensed](https://github.com/jasonmit/ember-cli-moment-shim/blob/master/LICENSE.md).

[npm]: https://www.npmjs.org/package/ember-cli-moment-shim
[npm-badge]: https://img.shields.io/npm/v/ember-cli-moment-shim.svg?style=flat-square
