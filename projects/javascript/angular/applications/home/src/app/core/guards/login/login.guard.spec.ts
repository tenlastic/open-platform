import { DOCUMENT } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnvironmentService, HttpModule, LoginService } from '@tenlastic/ng-http';
import { Chance } from 'chance';
import * as jsonwebtoken from 'jsonwebtoken';

import { IdentityService } from '../../services';
import { LoginGuard } from './login.guard';

describe('LoginGuard', () => {
  const chance = new Chance();

  let document: Document;
  let identityService: IdentityService;
  let loginService: LoginService;
  let service: LoginGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpModule],
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

    document = TestBed.inject(DOCUMENT);
    identityService = TestBed.inject(IdentityService);
    loginService = TestBed.inject(LoginService);
    service = TestBed.inject(LoginGuard);
  });

  describe('canActivate()', () => {
    let spy: jasmine.Spy;

    describe('when user is authenticated', () => {
      beforeEach(() => {
        const secret = chance.hash();
        const accessToken = jsonwebtoken.sign({ exp: new Date().getTime() }, secret);
        const refreshToken = jsonwebtoken.sign({ exp: new Date().getTime() }, secret);

        identityService.setAccessToken(accessToken);
        identityService.setRefreshToken(refreshToken);

        spy = spyOn(loginService.onLogout, 'emit');
      });

      it('it returns true', async () => {
        const result = await service.canActivate();

        expect(result).toEqual(true);
      });
    });

    describe('when user is not authenticated', () => {
      beforeEach(() => {
        identityService.setRefreshToken(null);
        spy = spyOn(loginService.onLogout, 'emit');
      });

      it('it navigates to the login page', async () => {
        await service.canActivate();

        expect(spy).toHaveBeenCalled();
      });

      it('returns false', async () => {
        const result = await service.canActivate();

        expect(result).toEqual(false);
      });
    });
  });
});
