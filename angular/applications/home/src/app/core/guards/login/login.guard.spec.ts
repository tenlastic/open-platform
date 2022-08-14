import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoginService, TokenService } from '@tenlastic/http';

import { HttpModule } from '../../../http.module';
import { LoginGuard } from './login.guard';

describe('LoginGuard', () => {
  let loginService: LoginService;
  let service: LoginGuard;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, HttpModule],
    });

    loginService = TestBed.inject(LoginService);
    service = TestBed.inject(LoginGuard);
    tokenService = TestBed.inject(TokenService);
  });

  describe('canActivate()', () => {
    let spy: jasmine.Spy;

    describe('when user is authenticated', () => {
      beforeEach(() => {
        const token =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIxNDc0ODM2NDd9._flG9gy9n7JKFZTfZX5a3oUiwOM2fAI0ul6dAT8mbKU';

        tokenService.setAccessToken(token);
        tokenService.setRefreshToken(token);

        spy = spyOn(loginService.emitter, 'emit');
      });

      it('it returns true', async () => {
        const result = await service.canActivate();

        expect(result).toEqual(true);
      });
    });

    describe('when user is not authenticated', () => {
      beforeEach(() => {
        tokenService.setRefreshToken(null);
        spy = spyOn(loginService.emitter, 'emit');
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
