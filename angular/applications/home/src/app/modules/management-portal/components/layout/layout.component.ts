import { Component, OnInit } from '@angular/core';
import { AuthorizationQuery, AuthorizationService, IAuthorization } from '@tenlastic/ng-http';

import { environment } from '../../../../../environments/environment';
import { ElectronService, IdentityService } from '../../../../core/services';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public IAuthorization = IAuthorization;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public isLoading = false;
  public launcherUrl = environment.launcherUrl;

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private electronService: ElectronService,
    private identityService: IdentityService,
  ) {}

  public async ngOnInit() {
    this.isLoading = true;
    await this.authorizationService.findUserAuthorizations(null, this.identityService.user?._id);
    this.isLoading = false;
  }

  public $hasPermission(roles: IAuthorization.AuthorizationRole[]) {
    return this.authorizationQuery.selectHasRoles(null, roles, this.identityService.user?._id);
  }
}
