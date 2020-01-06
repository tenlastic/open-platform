import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';

import { environment } from '../../../../environments/environment';
import { ElectronService } from '../../../core/services';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  public loginUrl = environment.loginUrl;
  public logoutUrl = environment.logoutUrl;

  constructor(
    public electronService: ElectronService,
    public identityService: IdentityService,
    public router: Router,
  ) {}

  public close() {
    const window = this.electronService.remote.getCurrentWindow();
    window.close();
  }

  public maximize() {
    const window = this.electronService.remote.getCurrentWindow();
    if (!window.isMaximized()) {
      window.maximize();
    } else {
      window.unmaximize();
    }
  }

  public minimize() {
    const window = this.electronService.remote.getCurrentWindow();
    window.minimize();
  }
}
