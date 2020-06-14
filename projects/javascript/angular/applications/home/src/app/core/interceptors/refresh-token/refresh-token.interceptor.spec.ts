import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpModule, LoginService, UserService } from '@tenlastic/ng-http';
import { Chance } from 'chance';
import * as jsonwebtoken from 'jsonwebtoken';

import { IdentityService } from '../../services/identity/identity.service';
import { RefreshTokenInterceptor } from './refresh-token.interceptor';

describe('RefreshTokenInterceptor', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let identityService: IdentityService;
  let interceptor: RefreshTokenInterceptor;
  let loginService: LoginService;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        HttpModule.forRoot({
          loginApiBaseUrl: 'http://localhost:3000/logins',
          userApiBaseUrl: 'http://localhost:3000/users',
        }),
      ],
      providers: [
        IdentityService,
        RefreshTokenInterceptor,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: RefreshTokenInterceptor,
          multi: true,
        },
      ],
    });

    httpMock = TestBed.get(HttpTestingController);
    identityService = TestBed.get(IdentityService);
    interceptor = TestBed.get(RefreshTokenInterceptor);
    loginService = TestBed.get(LoginService);
    userService = TestBed.get(UserService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('when the request is to the refresh token endpoint', () => {
    it('does not alter the request', () => {
      loginService.createWithRefreshToken('token').then(res => {
        expect(res).toBeTruthy();
      });

      const refreshTokenRequest = httpMock.expectOne(
        req => req.url === `${loginService.basePath}/refresh-token`,
      );
      refreshTokenRequest.flush({ accessToken: chance.hash(), secretToken: chance.hash() });
    });
  });

  describe('when the access and refresh tokens are expired', () => {
    it('does not alter the request', () => {
      identityService.accessToken = jsonwebtoken.sign({}, 'secret', { expiresIn: -10 });
      identityService.refreshToken = jsonwebtoken.sign({}, 'secret', { expiresIn: -10 });

      userService.find({}).then(res => {
        expect(res).toBeTruthy();
      });

      const userRequest = httpMock.expectOne(req => req.url === userService.basePath);
      userRequest.flush({ records: [] });
    });
  });

  describe('when the access token is expired', () => {
    it('refreshes the token and then performs the initial request', () => {
      const accessToken = jsonwebtoken.sign({}, 'secret', { expiresIn: -10 });
      const refreshToken = jsonwebtoken.sign({}, 'secret', { expiresIn: 10 });

      identityService.accessToken = accessToken;
      identityService.refreshToken = refreshToken;

      userService.find({}).then(res => {
        expect(res).toBeTruthy();
      });

      const refreshTokenRequest = httpMock.expectOne(
        req => req.url === `${loginService.basePath}/refresh-token`,
      );
      refreshTokenRequest.flush({ accessToken, refreshToken });
    });
  });
});
