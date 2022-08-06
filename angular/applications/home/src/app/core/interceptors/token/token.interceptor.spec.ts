import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { HttpModule, UserService } from '@tenlastic/ng-http';
import { Chance } from 'chance';

import { environment } from '../../../../environments/environment';
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
      imports: [HttpClientTestingModule, HttpModule.forRoot({ apiUrl: environment.apiUrl })],
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
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIxNDc0ODM2NDd9._flG9gy9n7JKFZTfZX5a3oUiwOM2fAI0ul6dAT8mbKU';
    identityService.setAccessToken(token);

    userService.find({}).then((response) => {
      expect(response).toBeTruthy();
    });

    tick();

    const httpRequest = httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`);
    expect(httpRequest.request.headers.get('Authorization')).toEqual(`Bearer ${token}`);

    flush();
  }));
});
