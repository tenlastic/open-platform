import { Chance } from 'chance';

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Collection } from '../../models/collection';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { CollectionService } from './collection.service';

describe('CollectionService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let service: CollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        CollectionService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CollectionService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a Collection', () => {
      const params = {
        name: chance.hash(),
      };

      service.create(params).then((res) => {
        expect(res).toEqual(jasmine.any(Collection));
        expect(res._id).toBeDefined();
        expect(res.name).toEqual(params.name);
      });

      const req = httpMock.expectOne(service.basePath);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          name: params.name,
        },
      });
    });
  });

  describe('delete()', () => {
    it('deletes the Collection and returns true', () => {
      const _id = chance.hash();

      service.delete(_id).then((res) => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of Collections', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then((res) => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(Collection));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne((r) => r.url === service.basePath);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a Collection', () => {
      const _id = chance.hash();

      service.findOne(_id).then((res) => {
        expect(res).toEqual(jasmine.any(Collection));
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
    it('updates and returns a Collection', () => {
      const params = {
        _id: chance.hash(),
        name: chance.hash(),
      };

      service.update(params).then((res) => {
        expect(res).toEqual(jasmine.any(Collection));
        expect(res._id).toEqual(params._id);
        expect(res.name).toEqual(params.name);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params._id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
