import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { TokenService } from '@tenlastic/http';

import { IdentityService } from '../../services';

@Injectable({ providedIn: 'root' })
export class IdentityGuard implements CanActivate {
  constructor(private identityService: IdentityService, private tokenService: TokenService) {}

  public async canActivate() {
    const accessToken = await this.tokenService.getAccessToken();
    this.identityService.setAccessToken(accessToken);

    return true;
  }

  public canActivateChild() {
    const refreshToken = this.tokenService.getRefreshToken();
    return Boolean(refreshToken);
  }
}
