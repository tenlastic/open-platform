import { DOCUMENT } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpModule, UserService } from '@tenlastic/ng-http';
import { Chance } from 'chance';

import { environment } from '../../../../environments/environment';
import { IdentityService } from '../../services/identity/identity.service';
import { UnauthorizedInterceptor } from './unauthorized.interceptor';

describe('UnauthorizedInterceptor', () => {
  const chance = new Chance();

  let document: Document;
  let httpMock: HttpTestingController;
  let interceptor: UnauthorizedInterceptor;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        HttpModule.forRoot({ apiUrl: environment.apiUrl }),
        RouterTestingModule.withRoutes([{ path: 'authentication/log-in', redirectTo: '' }]),
      ],
      providers: [
        IdentityService,
        UnauthorizedInterceptor,
        {
          provide: DOCUMENT,
          useValue: { location: { href: 'http://localhost' } },
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: UnauthorizedInterceptor,
          multi: true,
        },
      ],
    });

    document = TestBed.inject(DOCUMENT);
    httpMock = TestBed.inject(HttpTestingController);
    interceptor = TestBed.inject(UnauthorizedInterceptor);
    userService = TestBed.inject(UserService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('when the request is successful', () => {
    it('does not alter the response', () => {
      userService.find({}).then((response) => {
        expect(response).toBeTruthy();
      });

      httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`);
      expect(document.location.href).toBe('http://localhost');
    });
  });

  describe('when the request is unsuccessful', () => {
    it('redirects the user to the login URL', () => {
      userService.find({}).catch(() => {});

      const httpRequest = httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`);
      httpRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
