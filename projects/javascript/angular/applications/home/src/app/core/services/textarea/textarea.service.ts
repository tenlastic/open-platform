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
      if (this.isShiftDown) {
        const startIndex: number = target.selectionStart;
        const endIndex: number = target.selectionEnd;

        const start: string = target.value.substring(0, startIndex);
        const end = target.value.substring(endIndex);

        const lastIndexOf = start.lastIndexOf('\n');
        const success = start.substring(lastIndexOf).includes('    ');
        const substring = start.substring(lastIndexOf).replace('    ', '');
        const result = start.substring(0, lastIndexOf) + substring;

        target.value = result + end;
        target.selectionStart = target.selectionEnd = startIndex - (success ? 4 : 0);
      } else {
        const startIndex = target.selectionStart;
        const endIndex = target.selectionEnd;

        const start: string = target.value.substring(0, startIndex);
        const end = target.value.substring(endIndex);

        const lastIndexOf = start.lastIndexOf('\n');
        const substring = start.substring(lastIndexOf).replace('\n', '\n    ');
        const result = start.substring(0, lastIndexOf) + substring;

        target.value = result + end;
        target.selectionStart = target.selectionEnd = startIndex + 4;
      }
    }
  }

  public onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Shift') {
      this.isShiftDown = false;
    }
  }
}
