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

### Single module use

The default behavior for loading moment locales is an IIFE which is added into
the `vendor.js` file. The consequence of that is that you have no control over
when that code is run. That code also triggers [setting of the moment locale](https://github.com/moment/moment/blob/f6c7069/src/lib/locale/locales.js#L132),
which means that at arbitrary times in your application you don't know what the
locale is.

Included in `ember-cli-moment-shim` is a module that allows you to specify which
localization you would like to load, and when you would like it invoked. This
enables you to configure timing based upon application constraints. (With the
initial state being `en`.)

```js
// config.environment.js
module.exports = function(environment) {
  return {
    moment: {
      includeLocales: ['es', 'fr-ca'],
      singleModule: true
    }
  };
```

```js
// app/routes/applicaton.js
import Route from '@ember/routing/route';
import defineLocale from 'ember-cli-moment-shim/define-locale';
import moment from 'moment';
import { inject as service } from '@ember/service';

export default Route.extend({
  moment: service(),

  beforeModel() {
    const desiredLocale = 'en-us';

    // This adds the configuration for *just* the locale you want.
    // All locales specified as bundled by `includeLocales` will be available.
    defineLocale(desiredLocale);
    
    // Set the locale:
    moment.locale(desiredLocale);

    // It is possible for the locale in the `ember-moment`-supplied service to
    // get out of sync with the locale set in moment itself:
    // https://github.com/stefanpenner/ember-moment/blob/b8a262b/addon/services/moment.js#L50-L53
    // If using both the service and ES6 approach be sure to keep those values
    // consistent.
    this.get('moment').setLocale(desiredLocale);
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
