import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '@app/core/http';
import { IdentityService, SelectedNamespaceService } from '@app/core/services';

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

  constructor(
    private loginService: LoginService,
    public identityService: IdentityService,
    public router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public logout() {
    this.loginService.delete();
  }
}
