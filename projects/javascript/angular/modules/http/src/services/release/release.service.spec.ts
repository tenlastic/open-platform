import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Release } from '../../models/release';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { ReleaseService } from './release.service';

describe('ReleaseService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: ReleaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        ReleaseService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(ReleaseService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a Release', () => {
      const params = { version: chance.hash() };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(Release));
        expect(res._id).toBeDefined();
        expect(res.version).toEqual(params.version);
      });

      const req = httpMock.expectOne(`${service.basePath}`);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          version: params.version,
        },
      });
    });
  });

  describe('delete()', () => {
    it('deletes the user and returns true', () => {
      const _id = chance.hash();

      service.delete(_id).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of Releases', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(Release));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a Release', () => {
      const _id = chance.hash();

      service.findOne(_id).then(res => {
        expect(res).toEqual(jasmine.any(Release));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });

  describe('update()', () => {
    it('updates and returns a Release', () => {
      const params = {
        _id: chance.hash(),
        version: chance.hash(),
      };

      service.update(params).then(res => {
        expect(res).toEqual(jasmine.any(Release));
        expect(res._id).toEqual(params._id);
        expect(res.version).toEqual(params.version);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params._id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
