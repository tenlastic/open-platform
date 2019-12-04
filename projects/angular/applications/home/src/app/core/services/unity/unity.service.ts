import { EventEmitter, Injectable, Output } from '@angular/core';

export type UnityEventType =
  'closeWindow' |
  'error' |
  'fileCount' |
  'fileMessage' |
  'fileProgress' |
  'minimizeWindow' |
  'play' |
  'statusMessage' |
  'totalFileCount';

export interface UnityEvent {
  data?: any;
  type: UnityEventType;
}

@Injectable()
export class UnityService {

  @Output() public event = new EventEmitter();

  public isLauncher = false;

  constructor() {
    document.addEventListener('unity', (e: CustomEvent) => {
      // We are inside the Unity launcher if we received an event.
      this.isLauncher = true;

      this.event.emit(e.detail);
    });
  }

  public emit(detail: UnityEvent) {
    const event = new CustomEvent('unity', { detail });
    document.dispatchEvent(event);
  }

}
