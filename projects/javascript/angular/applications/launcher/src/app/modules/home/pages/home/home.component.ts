import { Component } from '@angular/core';
import { ElectronService } from '@tenlastic/ng-electron';
import { UserService } from '@tenlastic/ng-http';

import { environment } from '../../../../../environments/environment';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public launcherUrl = environment.launcherUrl;

  constructor(public electronService: ElectronService, public userService: UserService) {}
}
