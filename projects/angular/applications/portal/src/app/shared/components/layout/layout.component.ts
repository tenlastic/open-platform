import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';

import { environment } from '../../../../environments/environment';
import { SelectedNamespaceService } from '../../../core/services';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  public links = [
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'storage',
      label: 'Databases',
      path: '/databases',
    },
    {
      condition: () => this.selectedNamespaceService && this.selectedNamespaceService.namespaceId,
      icon: 'games',
      label: 'Games',
      path: '/games',
    },
    { icon: 'layers', label: 'Namespaces', path: '/namespaces' },
    {
      condition: () =>
        this.identityService &&
        this.identityService.user &&
        this.identityService.user.roles &&
        this.identityService.user.roles.includes('Admin'),
      icon: 'person',
      label: 'Users',
      path: '/users',
    },
  ];
  public loginUrl = environment.loginUrl;
  public logoutUrl = environment.logoutUrl;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public identityService: IdentityService,
    public router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public logout() {
    this.document.location.href = environment.logoutUrl;
  }
}
