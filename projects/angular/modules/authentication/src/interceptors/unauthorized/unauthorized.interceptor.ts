import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { EnvironmentService } from '../../services/environment/environment.service';
import { IdentityService } from '../../services/identity/identity.service';

/** @dynamic */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private environmentService: EnvironmentService,
    private identityService: IdentityService,
  ) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(request)
      .pipe(tap(() => {}, this.redirectToLoginOnUnauthorizedResponse.bind(this)));
  }

  private redirectToLoginOnUnauthorizedResponse(err: any) {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) {
        this.identityService.clear();
        this.document.location.href = this.environmentService.loginUrl;
      }
    }
  }
}
