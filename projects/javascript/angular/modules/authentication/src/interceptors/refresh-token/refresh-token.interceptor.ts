import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { LoginService } from '@tenlastic/ng-http';
import { Observable, BehaviorSubject, Subject, from } from 'rxjs';
import { switchMap, take, filter } from 'rxjs/operators';

import { IdentityService } from '../../services/identity/identity.service';

@Injectable()
export class RefreshTokenInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject: Subject<any> = new BehaviorSubject<any>(null);

  constructor(public identityService: IdentityService, public loginService: LoginService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.indexOf('/logins/refresh-token') >= 0) {
      return next.handle(request);
    }

    const accessExpired =
      !this.identityService.accessTokenJwt || this.identityService.accessTokenJwt.isExpired;
    const refreshExpired =
      !this.identityService.refreshTokenJwt || this.identityService.refreshTokenJwt.isExpired;

    if (!accessExpired || refreshExpired) {
      return next.handle(request);
    }

    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);

      const { refreshToken } = this.identityService;
      const observable = from(this.loginService.createWithRefreshToken(refreshToken));

      return observable.pipe(
        switchMap((response: any) => {
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(response.refreshToken);

          return next.handle(request);
        }),
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(result => result !== null),
        take(1),
        switchMap(() => next.handle(request)),
      );
    }
  }
}
