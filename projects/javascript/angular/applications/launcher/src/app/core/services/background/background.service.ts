import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BackgroundService {
  public src: string;
  public subject = new Subject<string>();

  constructor() {
    this.subject.subscribe(value => (this.src = value));
  }
}
