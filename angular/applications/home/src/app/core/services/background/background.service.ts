import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackgroundService {
  public subject = new Subject<string>();
  public value: string;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.subject.subscribe((url) => {
      const value = `url('${url}')` ?? `url('/assets/images/background.jpg')`;
      this.document.body.style.backgroundImage = value;
      this.value = value;
    });
  }
}
