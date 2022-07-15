import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  public async copy(value: string) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
    } else {
      // Create dummy element to copy.
      const selBox = document.createElement('textarea');
      selBox.style.position = 'fixed';
      selBox.style.left = '0';
      selBox.style.opacity = '0';
      selBox.style.top = '0';
      selBox.value = value;

      // Copy contents of created element.
      document.body.appendChild(selBox);
      selBox.focus();
      selBox.select();
      document.execCommand('copy');
      document.body.removeChild(selBox);
    }
  }
}
