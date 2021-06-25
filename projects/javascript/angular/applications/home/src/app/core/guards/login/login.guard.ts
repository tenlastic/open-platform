import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { LoginService } from '@tenlastic/ng-http';

import { IdentityService } from '../../services';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private identityService: IdentityService, private loginService: LoginService) {}

  public async canActivate() {
    const refreshToken = this.identityService.getRefreshToken();

    if (!refreshToken || refreshToken.isExpired) {
      this.loginService.onLogout.emit();
      return false;
    }

    return true;
  }

  public canActivateChild() {
    const refreshToken = this.identityService.getRefreshToken();
    return Boolean(refreshToken);
  }
}
