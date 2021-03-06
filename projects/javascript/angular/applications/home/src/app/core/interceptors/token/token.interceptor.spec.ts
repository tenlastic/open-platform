import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { HttpModule, UserService } from '@tenlastic/ng-http';
import { Chance } from 'chance';
import * as jsonwebtoken from 'jsonwebtoken';

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

    httpMock = TestBed.inject(HttpTestingController);
    identityService = TestBed.inject(IdentityService);
    interceptor = TestBed.inject(TokenInterceptor);
    userService = TestBed.inject(UserService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds an Authorization header', fakeAsync(() => {
    const secret = chance.hash();
    const accessToken = jsonwebtoken.sign({ exp: new Date().getTime() }, secret);
    identityService.setAccessToken(accessToken);

    userService.find({}).then(response => {
      expect(response).toBeTruthy();
    });

    tick();

    const httpRequest = httpMock.expectOne(req => req.url === userService.basePath);
    expect(httpRequest.request.headers.get('Authorization')).toEqual(`Bearer ${accessToken}`);

    flush();
  }));
});
