import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'asAny', pure: true })
export class AsAnyPipe implements PipeTransform {
  public transform(value: any) {
    return value as any;
  }
}
