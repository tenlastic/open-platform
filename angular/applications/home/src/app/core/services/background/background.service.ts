import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackgroundService {
  private readonly default = '/assets/images/background.jpg';
  private subject = new Subject<string>();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.subject.subscribe((value) => {
      this.document.documentElement.style.setProperty('--background-image', value);
    });
  }

  public set(value: string) {
    this.subject.next(`url('${value || this.default}')`);
  }

  public unset() {
    this.subject.next(null);
  }
}
