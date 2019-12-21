import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IdentityService } from '../../services/identity/identity.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private identityService: IdentityService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.identityService.accessToken}`,
      },
    });

    return next
      .handle(request)
      .pipe(tap(() => {}, this.redirectToLoginOnUnauthorizedResponse.bind(this)));
  }

  private redirectToLoginOnUnauthorizedResponse(err: any) {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) {
        this.identityService.clear();
        this.router.navigateByUrl('/login');
      }
    }
  }
}
