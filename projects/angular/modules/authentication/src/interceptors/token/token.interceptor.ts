import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IdentityService } from '../../services/identity/identity.service';

/** @dynamic */
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private identityService: IdentityService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.identityService.accessToken}`,
      },
    });

    return next.handle(request);
  }
}
