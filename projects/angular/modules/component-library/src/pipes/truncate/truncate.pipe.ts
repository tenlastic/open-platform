import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 25, completeWords = false, ellipsis = '...') {
    if (!value) {
      return value;
    }

    if (completeWords) {
      limit = value.length > limit ? value.substr(0, limit).lastIndexOf(' ') : limit;
    }

    return value.length > limit ? value.substr(0, limit) + ellipsis : value;
  }
}
