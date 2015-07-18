# ember-cli-moment-shim
[![Build Status](https://travis-ci.org/jasonmit/ember-cli-moment-shim.svg?branch=master)](https://travis-ci.org/jasonmit/ember-cli-moment-shim)

ES6 accessible module for momentjs within your Ember applications.

## Usage

* ember-cli < 0.2.3 `ember install:addon ember-cli-moment-shim`
* ember-cli >= 0.2.3 `ember install ember-cli-moment-shim`

```js
import moment from 'moment';
```

## Enabling moment-timezone

```js
// config.environment.js
module.exports = function(environment) {
  var ENV = {
    moment: {
      // Options:
      // 'all' - all years, all timezones
      // '2010-2020' - 2010-2020, all timezones
      // 'none' - no data, just timezone API
      includeTimezone: 'all'
    }
  };
```

## License

ember-cli-moment-shim shims is [MIT Licensed](https://github.com/jasonmit/ember-cli-moment-shim/blob/master/LICENSE.md).
