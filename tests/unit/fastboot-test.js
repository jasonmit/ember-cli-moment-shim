/* globals requirejs require */

import { module, test } from 'qunit';
import config from 'ember-get-config';

module('FastBoot', function() {
  module('with timezone', function(hooks) {
    hooks.beforeEach(function() {
      this.oldValue = config.moment.includeTimezone;
      config.moment.includeTimezone = true;
    });

    hooks.afterEach(function() {
      config.moment.includeTimezone = this.oldValue;
    });

    test('If the global FastBoot object exists, requiring moment will pull from FastBoot', async function(assert) {
      assert.expect(1);

      requirejs.unsee('moment');
      requirejs.unsee('moment/lib');

      self.FastBoot = {
        require(val) {
          assert.equal(val, 'moment-timezone');

          return function () {};
        }
      }

      require('moment');
    });
  });

  module('without timezone', function(hooks) {
    hooks.beforeEach(function() {
      this.oldValue = config.moment.includeTimezone;
      config.moment.includeTimezone = false;
    });

    hooks.afterEach(function() {
      config.moment.includeTimezone = this.oldValue;
    });

    test('If the global FastBoot object exists, requiring moment will pull from FastBoot', async function(assert) {
      assert.expect(1);

      requirejs.unsee('moment');
      requirejs.unsee('moment/lib');

      self.FastBoot = {
        require(val) {
          assert.equal(val, 'moment');

          return function () {};
        }
      }

      require('moment');
    });
  });
});
