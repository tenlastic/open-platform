import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { LoginService, NamespaceService } from '@app/core/http';
import { IdentityService, SelectedNamespaceService } from '@app/core/services';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private identityService: IdentityService,
    private loginService: LoginService,
    private namespaceService: NamespaceService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  async canActivate() {
    if (this.identityService.refreshToken) {
      try {
        await this.loginService.createWithRefreshToken(this.identityService.refreshToken);

        if (this.selectedNamespaceService.namespaceId) {
          this.selectedNamespaceService.namespace = await this.namespaceService.findOne(
            this.selectedNamespaceService.namespaceId,
          );
        }
      } catch {
        this.router.navigateByUrl('/login');
        return false;
      }
    } else {
      this.router.navigateByUrl('/login');
      return false;
    }

    return true;
  }

  canActivateChild() {
    return Boolean(this.identityService.refreshToken);
  }
}
