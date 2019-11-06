import { Injectable } from '@angular/core';

import { UnityEvent, UnityService } from '../unity/unity.service';

@Injectable()
export class PatchService {

  public fileCount = 0;
  public error: string;
  public fileMessage: string;
  public fileProgress = 0;
  public isReady = false;
  public statusMessage: string;
  public totalFileCount = 1;
  public get totalProgress() {
    return this.fileCount / this.totalFileCount;
  }

  constructor(public unityService: UnityService) {
    this.unityService.event.subscribe(this.onUnityEvent.bind(this));
  }

  private onUnityEvent(event: UnityEvent) {
    switch (event.type) {
      case 'error':
        this.error = event.data;
        break;

      case 'fileCount':
        this.fileCount = event.data;
        break;

      case 'fileMessage':
        this.fileMessage = event.data;
        break;

      case 'fileProgress':
        this.fileProgress = event.data;
        break;

      case 'statusMessage':
        this.statusMessage = event.data;

        if (this.statusMessage === 'Update complete.') {
          this.isReady = true;
        }

        break;

      case 'totalFileCount':
        this.totalFileCount = event.data;
        break;
    }
  }

}
