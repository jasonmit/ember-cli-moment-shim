import Route from '@ember/routing/route';
import moment from 'moment';

export default Route.extend({
  model() {
    return moment().tz('America/Los_Angeles').format('ha z');
  }
});
