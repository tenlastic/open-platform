import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truthy', standalone: false })
export class TruthyPipe implements PipeTransform {
  transform(value: any[]) {
    return value.filter((v) => v);
  }
}
