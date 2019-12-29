import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnvironmentService, HttpModule, LoginService } from '@tenlastic/ng-http';
import { Chance } from 'chance';
import * as jsonwebtoken from 'jsonwebtoken';

import { IdentityService } from '../../services/identity/identity.service';
import { AuthenticationModule } from '../../module';
import { LoginGuard } from './login.guard';

describe('LoginGuard', () => {
  const chance = new Chance();

  const loginUrl = chance.url();
  const logoutUrl = chance.url();

  let document: Document;
  let identityService: IdentityService;
  let loginService: LoginService;
  let service: LoginGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AuthenticationModule.forRoot({ loginUrl, logoutUrl }),
        HttpClientTestingModule,
        HttpModule,
      ],
      providers: [
        IdentityService,
        {
          provide: DOCUMENT,
          useValue: { location: { href: 'http://localhost' } },
        },
        {
          provide: EnvironmentService,
          useValue: { loginApiBaseUrl: 'http://localhost:3000/logins' },
        },
      ],
    });

    document = TestBed.get(DOCUMENT);
    identityService = TestBed.get(IdentityService);
    loginService = TestBed.get(LoginService);
    service = TestBed.get(LoginGuard);
  });

  describe('canActivate()', () => {
    describe('when user is authenticated', () => {
      beforeEach(() => {
        const secret = chance.hash();
        identityService.accessToken = jsonwebtoken.sign({}, secret);
        identityService.refreshToken = jsonwebtoken.sign({}, secret);

        spyOn(loginService, 'createWithRefreshToken').and.returnValue(Promise.resolve());
      });

      it('it returns true', async () => {
        const result = await service.canActivate();

        expect(result).toEqual(true);
      });
    });

    describe('when user is not authenticated', () => {
      beforeEach(() => {
        identityService.refreshToken = null;
      });

      it('it navigates to the login page', async () => {
        await service.canActivate();

        expect(document.location.href).toBe(loginUrl);
      });

      it('returns false', async () => {
        const result = await service.canActivate();

        expect(result).toEqual(false);
      });
    });
  });
});
