import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Database } from '../../models/database';
import { ApiService } from '../api/api.service';
import { EnvironmentService, EnvironmentServiceConfig } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        DatabaseService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(DatabaseService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a Database', () => {
      const params = {
        name: chance.hash(),
      };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(Database));
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
    it('returns an array of Databases', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(Database));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === service.basePath);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a Database', () => {
      const _id = chance.hash();

      service.findOne(_id).then(res => {
        expect(res).toEqual(jasmine.any(Database));
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
    it('updates and returns a Database', () => {
      const params = {
        _id: chance.hash(),
        name: chance.hash(),
      };

      service.update(params).then(res => {
        expect(res).toEqual(jasmine.any(Database));
        expect(res._id).toEqual(params._id);
        expect(res.name).toEqual(params.name);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params._id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
