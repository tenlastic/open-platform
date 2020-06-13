import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  public launcherUrl = environment.launcherUrl;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public electronService: ElectronService,
    public identityService: IdentityService,
    public router: Router,
  ) {}

  public navigateToLogin() {
    if (this.electronService.isElectron) {
      this.router.navigateByUrl('/authentication/log-in');
    } else {
      this.document.location.href = environment.loginUrl;
    }
  }

  public navigateToLogout() {
    if (this.electronService.isElectron) {
      this.router.navigateByUrl('/authentication/log-out');
    } else {
      this.document.location.href = environment.logoutUrl;
    }
  }
}
