import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AuthorizationService, AuthorizationState, IAuthorization } from '@tenlastic/http';

import { environment } from '../../../../../environments/environment';
import { ElectronService, IdentityService, SideMenuService } from '../../../../core/services';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements AfterViewInit, OnInit {
  @ViewChild('sideMenu') private sideMenuTemplate: TemplateRef<unknown>;

  public get $sideMenuIsVisible() {
    return this.sideMenuService.$visible;
  }
  public IAuthorization = IAuthorization;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public isLoading = false;
  public launcherUrl = environment.launcherUrl;

  constructor(
    private authorizationState: AuthorizationState,
    private authorizationService: AuthorizationService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private sideMenuService: SideMenuService,
  ) {}

  public async ngOnInit() {
    this.isLoading = true;
    await this.authorizationService.findUserAuthorizations(null, this.identityService.user?._id);
    this.isLoading = false;
  }

  public ngAfterViewInit() {
    this.sideMenuService.add(this.sideMenuTemplate);
  }

  public ngOnDestroy() {
    this.sideMenuService.remove(this.sideMenuTemplate);
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    return this.authorizationState.selectHasRoles(null, roles, this.identityService.user?._id);
  }

  public toggleSideMenu() {
    if (this.sideMenuService.visible) {
      this.sideMenuService.hide();
    } else {
      this.sideMenuService.show();
    }
  }
}
