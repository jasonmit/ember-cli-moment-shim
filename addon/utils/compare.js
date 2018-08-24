import moment from 'moment';

export default function compare(a, b) {
  if (moment.isMoment(a) && moment.isMoment(b)) {
    if (a.isBefore(b)) {
      return -1;
    } else if (a.isSame(b)) {
      return 0;
    } else {
      return 1;
    }
  }

  throw new Error('Arguments provided to `compare` are not moment objects');
}
