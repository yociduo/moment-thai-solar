import * as moment from 'moment';

declare module 'moment' {
  export interface Moment {
    thaiYear(y: number): Moment;
    thaiYear(): number;
  }
}

export = moment;