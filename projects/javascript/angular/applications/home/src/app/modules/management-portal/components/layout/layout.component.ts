import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../../../environments/environment';
import {
  ElectronService,
  IdentityService,
  SelectedNamespaceService,
} from '../../../../core/services';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  public get hasInfrastructureButtons() {
    return (
      this.hasPermission('builds') ||
      this.hasPermission('collections') ||
      this.hasPermission('game-servers') ||
      this.hasPermission('queues')
    );
  }
  public get hasLauncherButtons() {
    return (
      this.hasPermission('articles') ||
      this.hasPermission('game-invitations') ||
      this.hasPermission('games')
    );
  }
  public launcherUrl = environment.launcherUrl;
  public showInfrastructureButtons = true;
  public showLauncherButtons = true;

  constructor(
    public electronService: ElectronService,
    public identityService: IdentityService,
    public router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public hasPermission(role: string) {
    if (this.identityService.user.roles.includes(role)) {
      return true;
    }

    return this.selectedNamespaceService.namespace.users
      .find(u => u._id === this.identityService.user._id)
      .roles.includes(role);
  }
}
