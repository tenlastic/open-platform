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

import { IdentityService } from '@app/core/services';

@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  constructor(private identityService: IdentityService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(request)
      .pipe(tap(null, this.redirectToLoginOnUnauthorizedResponse.bind(this)));
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
