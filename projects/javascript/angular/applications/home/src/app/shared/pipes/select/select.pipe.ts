import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'select' })
export class SelectPipe implements PipeTransform {
  transform(value: any[], key: string) {
    return value ? value.map(v => v[key]) : value;
  }
}
