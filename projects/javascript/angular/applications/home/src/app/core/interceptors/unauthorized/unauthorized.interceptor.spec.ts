import { DOCUMENT } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpModule, UserService } from '@tenlastic/ng-http';
import { Chance } from 'chance';

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
        HttpModule.forRoot({
          loginApiBaseUrl: 'http://localhost:3000/logins',
          userApiBaseUrl: 'http://localhost:3000/users',
        }),
        RouterTestingModule,
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

    document = TestBed.get(DOCUMENT);
    httpMock = TestBed.get(HttpTestingController);
    interceptor = TestBed.get(UnauthorizedInterceptor);
    userService = TestBed.get(UserService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('when the request is successful', () => {
    it('does not alter the response', () => {
      userService.find({}).then(response => {
        expect(response).toBeTruthy();
      });

      httpMock.expectOne(req => req.url === userService.basePath);
      expect(document.location.href).toBe('http://localhost');
    });
  });

  describe('when the request is unsuccessful', () => {
    it('redirects the user to the login URL', () => {
      userService.find({}).catch(() => {});

      const httpRequest = httpMock.expectOne(req => req.url === userService.basePath);
      httpRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
