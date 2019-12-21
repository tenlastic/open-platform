import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Chance } from 'chance';
import * as jsonwebtoken from 'jsonwebtoken';

import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { LoginService } from './login.service';

describe('LoginService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        LoginService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(LoginService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createWithCredentials()', () => {
    it('emits the accessToken and refreshToken', () => {
      const email = chance.email();
      const password = chance.hash();
      const spy = spyOn(service.onLogin, 'emit');

      service.createWithCredentials(email, password).then(() => {
        expect(spy).toHaveBeenCalled();
      });

      const secret = chance.hash();
      const accessToken = jsonwebtoken.sign({}, secret);
      const refreshToken = jsonwebtoken.sign({}, secret);

      const req = httpMock.expectOne(`${service.basePath}`);
      expect(req.request.method).toBe('POST');
      req.flush({ accessToken, refreshToken });
    });
  });

  describe('createWithRefreshToken()', () => {
    it('emits the accessToken and refreshToken', () => {
      const token = chance.hash();
      const spy = spyOn(service.onLogin, 'emit');

      service.createWithRefreshToken(token).then(() => {
        expect(spy).toHaveBeenCalled();
      });

      const secret = chance.hash();
      const accessToken = jsonwebtoken.sign({}, secret);
      const refreshToken = jsonwebtoken.sign({}, secret);

      const req = httpMock.expectOne(`${service.basePath}/refresh-token`);
      expect(req.request.method).toBe('POST');
      req.flush({ accessToken, refreshToken });
    });
  });

  describe('delete()', () => {
    it('emits a logout event', () => {
      const spy = spyOn(service.onLogout, 'emit');

      service.delete().then(() => {
        expect(spy).toHaveBeenCalled();
      });

      const req = httpMock.expectOne(`${service.basePath}`);
      expect(req.request.method).toBe('DELETE');
    });
  });
});
