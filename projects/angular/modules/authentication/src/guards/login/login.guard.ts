import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { EnvironmentService } from '../../services/environment/environment.service';
import { IdentityService } from '../../services/identity/identity.service';

/** @dynamic */
@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private environmentService: EnvironmentService,
    private identityService: IdentityService,
  ) {}

  public async canActivate() {
    if (!this.identityService.refreshToken || this.identityService.refreshTokenJwt.isExpired) {
      this.document.location.href = this.environmentService.loginUrl;
      return false;
    }

    return true;
  }

  public canActivateChild() {
    return Boolean(this.identityService.refreshToken);
  }
}
