import { Component } from '@angular/core';

import { PatchService, UnityService } from '@app/core/services';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  public get isPatchStatusVisible() {
    return this.unityService.isLauncher && !this.patchService.isReady;
  }

  constructor(public patchService: PatchService,
              public unityService: UnityService) {}

}
