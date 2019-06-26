/* globals self */

import config from 'ember-get-config';

let moment;
const localeOutputPath = config.moment && config.moment.includeTimezone;

if (typeof self.FastBoot === 'undefined') {
  moment = self.moment;
} else if (localeOutputPath) {
  moment = self.FastBoot.require('moment-timezone');
} else {
  moment = self.FastBoot.require('moment');
}

export default moment;
