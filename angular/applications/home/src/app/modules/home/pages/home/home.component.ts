import { Component } from '@angular/core';
import { UserService } from '@tenlastic/http';

import { environment } from '../../../../../environments/environment';
import { ElectronService } from '../../../../core/services';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public launcherUrl = environment.launcherUrl;

  constructor(public electronService: ElectronService, public userService: UserService) {}
}
