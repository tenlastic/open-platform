import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TextareaService {
  private isShiftDown = false;

  public onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.isShiftDown = true;
    }

    if (event.key === 'Tab') {
      event.preventDefault();

      const target = event.target as HTMLTextAreaElement;

      const startIndex = target.selectionStart;
      const start = target.value.substring(0, startIndex);

      const endIndex = target.selectionEnd;
      const end = target.value.substring(endIndex);

      if (this.isShiftDown) {
        const lastIndexOf = start.lastIndexOf('\n');
        let occurences = start.substring(lastIndexOf).includes('    ') ? 1 : 0;
        const successful = occurences > 0;
        const substring = start.substring(lastIndexOf).replace('    ', '');
        const startReplacement = start.substring(0, lastIndexOf) + substring;

        let selectionReplacement = '';
        if (endIndex !== startIndex) {
          const selection = target.value.substring(startIndex, endIndex);
          occurences += selection.split('\n    ').length - 1;
          selectionReplacement = selection.replace(/\n    /g, '\n');
        }

        target.value = startReplacement + selectionReplacement + end;

        target.selectionStart = target.selectionEnd = startIndex - (occurences ? 4 : 0);
        if (endIndex !== startIndex) {
          target.selectionEnd += endIndex - startIndex - 4 * (occurences ? occurences - 1 : 0);
        }

        if (occurences && !successful) {
          target.selectionStart += 4;
        }
      } else {
        const lastIndexOf = start.lastIndexOf('\n');
        const substring = start.substring(lastIndexOf).replace('\n', '\n    ');
        const startReplacement = start.substring(0, lastIndexOf) + substring;

        let occurences = 0;
        let selectionReplacement = '';
        if (endIndex !== startIndex) {
          const selection = target.value.substring(startIndex, endIndex);
          occurences += selection.split('\n').length - 1;
          selectionReplacement = selection.replace(/\n/g, '\n    ');
        }

        target.value = startReplacement + selectionReplacement + end;

        target.selectionStart = target.selectionEnd = startIndex + 4;
        if (endIndex !== startIndex) {
          target.selectionEnd += endIndex - startIndex + 4 * occurences;
        }
      }
    }
  }

  public onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.isShiftDown = false;
    }
  }
}
