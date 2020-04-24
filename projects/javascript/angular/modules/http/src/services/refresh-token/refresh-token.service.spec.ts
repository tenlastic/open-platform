import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RefreshToken } from '../../models/refresh-token';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: RefreshTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        RefreshTokenService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(RefreshTokenService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a RefreshToken', () => {
      const params = {
        description: chance.hash(),
      };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(RefreshToken));
        expect(res.record.jti).toBeDefined();
        expect(res.record.description).toEqual(params.description);
      });

      const req = httpMock.expectOne(service.basePath);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          jti: chance.hash(),
          description: params.description,
        },
        refreshToken: chance.hash(),
      });
    });
  });

  describe('delete()', () => {
    it('deletes the user and returns true', () => {
      const jti = chance.hash();

      service.delete(jti).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${jti}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of RefreshTokens', () => {
      const jti = chance.hash();
      const params = {
        where: { jti },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(RefreshToken));
        expect(res[0].jti).toBe(jti);
      });

      const req = httpMock.expectOne(r => r.url === service.basePath);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ jti }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a RefreshToken', () => {
      const jti = chance.hash();

      service.findOne(jti).then(res => {
        expect(res).toEqual(jasmine.any(RefreshToken));
        expect(res.jti).toBe(jti);
      });

      const req = httpMock.expectOne(`${service.basePath}/${jti}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { jti },
      });
    });
  });

  describe('update()', () => {
    it('updates and returns a RefreshToken', () => {
      const params = {
        jti: chance.hash(),
        description: chance.hash(),
      };

      service.update(params).then(res => {
        expect(res).toEqual(jasmine.any(RefreshToken));
        expect(res.jti).toEqual(params.jti);
        expect(res.description).toEqual(params.description);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params.jti}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
