import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  public launcherUrl = environment.launcherUrl;
  public loginUrl = environment.loginUrl;
  public logoutUrl = environment.logoutUrl;

  constructor(public identityService: IdentityService, public router: Router) {}
}
