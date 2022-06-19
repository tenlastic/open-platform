import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sum', pure: false })
export class SumPipe implements PipeTransform {

  public transform(items: any[], attr?: string) {
    if (!items) {
      return 0;
    }

    if (attr) {
      return items.reduce((a, b) => a + b[attr], 0);
    } else {
      return items.reduce((a, b) => a + b, 0);
    }
  }

}
