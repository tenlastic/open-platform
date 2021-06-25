import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { IdentityService } from '../../services/identity/identity.service';

/** @dynamic */
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private identityService: IdentityService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (request.url.includes('/logins/refresh-token')) {
      return next.handle(request);
    }

    return from(this.identityService.getAccessToken()).pipe(
      switchMap(accessToken => {
        if (accessToken) {
          request = request.clone({ setHeaders: { Authorization: `Bearer ${accessToken.value}` } });
          return next.handle(request);
        } else {
          return next.handle(request);
        }
      }),
    );
  }
}
