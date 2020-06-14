import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpModule, UserService } from '@tenlastic/ng-http';
import { Chance } from 'chance';

import { IdentityService } from '../../services/identity/identity.service';
import { TokenInterceptor } from './token.interceptor';

describe('TokenInterceptor', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let identityService: IdentityService;
  let interceptor: TokenInterceptor;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        HttpModule.forRoot({ userApiBaseUrl: 'http://localhost:3000/users' }),
      ],
      providers: [
        IdentityService,
        TokenInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: TokenInterceptor,
          multi: true,
        },
      ],
    });

    httpMock = TestBed.get(HttpTestingController);
    identityService = TestBed.get(IdentityService);
    interceptor = TestBed.get(TokenInterceptor);
    userService = TestBed.get(UserService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds an Authorization header', () => {
    identityService.accessToken = 'token';

    userService.find({}).then(response => {
      expect(response).toBeTruthy();
    });

    const httpRequest = httpMock.expectOne(req => req.url === userService.basePath);
    expect(httpRequest.request.headers.get('Authorization')).toEqual(`Bearer token`);
  });
});
