import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { PatchService, UnityService } from '@app/core/services';
import { environment } from '@env/environment';

@Component({
  selector: 'app-play-now-button',
  styleUrls: ['play-now-button.component.scss'],
  templateUrl: 'play-now-button.component.html',
})
export class PlayNowButtonComponent {
  public environment = environment;

  public get isReady() {
    return !this.unityService.isLauncher || this.patchService.isReady;
  }

  constructor(
    public patchService: PatchService,
    private router: Router,
    public unityService: UnityService,
  ) {}

  public click() {
    if (this.unityService.isLauncher) {
      this.unityService.emit({ type: 'play' });
    } else {
      this.router.navigateByUrl('/play-now');
    }
  }
}
