import Ember from 'ember';
import config from '../../config/environment';

const { get } = Ember;

export default {
  name: 'ember-cli-moment-shim',

  initialize() {
    define('~moment', ['exports'], function(exports) {
      const includeTimezone = get(config, 'ember-cli-moment-shim.includeTimezone') || false;

      exports['default'] = FastBoot.require(includeTimezone ? 'moment-timezone' : 'moment');
    });
  }
}
