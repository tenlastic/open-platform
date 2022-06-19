import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  public transform(milliseconds: number) {
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const daysMilliseconds = milliseconds % (24 * 60 * 60 * 1000);
    const hours = Math.floor(daysMilliseconds / (60 * 60 * 1000));
    const hoursMilliseconds = milliseconds % (60 * 60 * 1000);
    const minutes = Math.floor(hoursMilliseconds / (60 * 1000));
    const minutesMilliseconds = milliseconds % (60 * 1000);
    const seconds = Math.floor(minutesMilliseconds / 1000);

    const strings = [];
    if (days > 0) {
      strings.push(`${days} Day(s)`);
    }
    if (hours > 0) {
      strings.push(`${hours} Hour(s)`);
    }
    if (minutes > 0) {
      strings.push(`${minutes} Minute(s)`);
    }
    if (seconds > 0) {
      strings.push(`${seconds} Second(s)`);
    }

    return strings.join(', ');
  }
}
