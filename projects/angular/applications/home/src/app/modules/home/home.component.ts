import { Component, OnInit } from '@angular/core';
import { UserService } from '@tenlastic/http-services';

import { PatchService, UnityService } from '@app/core/services';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public get isPatchStatusVisible() {
    return this.unityService.isLauncher && !this.patchService.isReady;
  }

  constructor(
    public patchService: PatchService,
    public unityService: UnityService,
    public userService: UserService,
  ) {}

  public async ngOnInit() {
    const result = await this.userService.find(null);
    console.log(result);
  }
}
