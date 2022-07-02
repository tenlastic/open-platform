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
      this.hasPermission('workflows') ||
      this.hasPermission('queues')
    );
  }
  public get hasLauncherButtons() {
    return this.hasPermission('articles') || this.hasPermission('games');
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
    const namespace = this.selectedNamespaceService.namespace;
    const namespaceUser = namespace.users?.find((u) => u._id === this.identityService.user._id);
    const user = this.identityService.user;

    return namespaceUser?.roles.includes(role) || user.roles.includes(role);
  }
}
