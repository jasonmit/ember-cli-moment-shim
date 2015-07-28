# ember-cli-moment-shim
[![Build Status](https://travis-ci.org/jasonmit/ember-cli-moment-shim.svg?branch=master)](https://travis-ci.org/jasonmit/ember-cli-moment-shim)

ES6 accessible module for momentjs within your Ember applications.

## Usage

* ember-cli < 0.2.3 `ember install:addon ember-cli-moment-shim`
* ember-cli >= 0.2.3 `ember install ember-cli-moment-shim`

```js
import moment from 'moment';
```
## Upgrading

Whenever an upgrading ember-cli-moment-shim, be sure to rerun the generator manually if not installed via `ember install`.  To do this, `ember g ember-cli-moment-shim`

## Enabling moment-timezone

```js
// config.environment.js
module.exports = function(environment) {
  return {
    moment: {
      // Options:
      // 'all' - all years, all timezones
      // '2010-2020' - 2010-2020, all timezones
      // 'none' - no data, just timezone API
      includeTimezone: 'all'
    }
  };
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

Feature set of i18n support within moment can be found here:  http://momentjs.com/docs/#/i18n/

## License

ember-cli-moment-shim shims is [MIT Licensed](https://github.com/jasonmit/ember-cli-moment-shim/blob/master/LICENSE.md).
