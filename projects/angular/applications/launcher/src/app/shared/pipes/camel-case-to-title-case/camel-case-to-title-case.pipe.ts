import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'camelCaseToTitleCase' })
export class CamelCaseToTitleCasePipe implements PipeTransform {
  transform(value: string) {
    const result = value.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}
