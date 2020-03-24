import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { LoginService } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private identityService: IdentityService, private loginService: LoginService) {}

  public async canActivate() {
    if (!this.identityService.refreshToken || this.identityService.refreshTokenJwt.isExpired) {
      this.loginService.onLogout.emit();

      return false;
    }

    return true;
  }

  public canActivateChild() {
    return Boolean(this.identityService.refreshToken);
  }
}
