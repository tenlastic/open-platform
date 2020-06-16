import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
  public launcherUrl = environment.launcherUrl;
  public links = [
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'description',
      label: 'Articles',
      path: 'articles',
    },
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'sd_card',
      label: 'Databases',
      path: 'databases',
    },
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'person_add_alt_1',
      label: 'Game Invitations',
      path: 'game-invitations',
    },
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'dns',
      label: 'Game Servers',
      path: 'game-servers',
    },
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'sports_esports',
      label: 'Games',
      path: 'games',
    },
    { icon: 'layers', label: 'Namespaces', path: 'namespaces' },
    {
      condition: () => this.identityService && this.identityService.user,
      icon: 'vpn_key',
      label: 'Refresh Tokens',
      path: 'refresh-tokens',
    },
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'unarchive',
      label: 'Releases',
      path: 'releases',
    },
    {
      condition: () =>
        this.identityService &&
        this.identityService.user &&
        this.identityService.user.roles &&
        this.identityService.user.roles.includes('Administrator'),
      icon: 'person',
      label: 'Users',
      path: 'users',
    },
  ];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public electronService: ElectronService,
    public identityService: IdentityService,
    public router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}
}
