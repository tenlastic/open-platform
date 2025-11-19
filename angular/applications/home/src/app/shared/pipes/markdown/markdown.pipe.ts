import { Pipe, PipeTransform } from '@angular/core';
import marked from 'marked';

@Pipe({ name: 'markdown', standalone: false })
export class MarkdownPipe implements PipeTransform {
  transform(value: string) {
    return value ? marked(value, { headerIds: false }) : '';
  }
}
