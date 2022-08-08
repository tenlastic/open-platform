import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { LoginService, TokenService } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private loginService: LoginService, private tokenService: TokenService) {}

  public async canActivate() {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken || refreshToken.isExpired) {
      this.loginService.emitter.emit('logout');
      return false;
    }

    return true;
  }

  public canActivateChild() {
    const refreshToken = this.tokenService.getRefreshToken();
    return Boolean(refreshToken);
  }
}
