import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Chance } from 'chance';

import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let service: PasswordResetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        PasswordResetService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PasswordResetService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('resolves', () => {
      const email = chance.email();

      service.create(email).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(service.basePath);
      expect(req.request.method).toBe('POST');
    });
  });

  describe('delete()', () => {
    it('resolves', () => {
      const hash = chance.hash();
      const password = chance.hash();

      service.delete(hash, password).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${hash}`);
      expect(req.request.method).toBe('DELETE');
    });
  });
});
