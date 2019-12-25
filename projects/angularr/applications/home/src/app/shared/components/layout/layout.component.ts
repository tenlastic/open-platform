import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { PatchService, UnityService } from '../../../core/services';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  public get isPatchStatusVisible() {
    return this.unityService.isLauncher && !this.patchService.isReady;
  }

  constructor(
    public patchService: PatchService,
    public router: Router,
    public unityService: UnityService,
  ) {}

  public closeWindow() {
    this.unityService.emit({ type: 'closeWindow' });
  }

  public minimizeWindow() {
    this.unityService.emit({ type: 'minimizeWindow' });
  }
}
