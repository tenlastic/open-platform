import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { LoginService } from '../../services/login/login.service';
import { IdentityService } from '../../services/identity/identity.service';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private identityService: IdentityService,
    private loginService: LoginService,
    private router: Router,
  ) {}

  public async canActivate() {
    if (this.identityService.refreshToken) {
      try {
        await this.loginService.createWithRefreshToken(this.identityService.refreshToken);
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

  public canActivateChild() {
    return Boolean(this.identityService.refreshToken);
  }
}
