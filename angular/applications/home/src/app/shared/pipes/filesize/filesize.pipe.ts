import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filesize' })
export class FilesizePipe implements PipeTransform {
  public transform(bytes: number, decimals = 2) {
    if (bytes === 0) {
      return '0 B';
    }

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

    const index = Math.floor(Math.log(bytes) / Math.log(1000));
    const size = sizes[index];
    const value = bytes / Math.pow(1000, index);

    return value.toFixed(decimals) + ' ' + size;
  }
}
