import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Record } from '../../models/record';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { RecordService } from './record.service';

describe('RecordService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: RecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        RecordService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(RecordService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('create()', () => {
    it('creates and returns a Record', () => {
      const databaseName = chance.hash();
      const collectionName = chance.hash();
      const params = {
        properties: { name: chance.hash() },
      };

      service.create(databaseName, collectionName, params).then(res => {
        expect(res).toEqual(jasmine.any(Record));
        expect(res._id).toBeDefined();
        expect(res.properties.name).toEqual(params.properties.name);
      });

      const req = httpMock.expectOne(
        `${service.basePath}/${databaseName}/collections/${collectionName}/records`,
      );
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          properties: { name: params.properties.name },
        },
      });
    });
  });

  describe('delete()', () => {
    it('deletes the Record and returns true', () => {
      const _id = chance.hash();
      const collectionName = chance.hash();
      const databaseName = chance.hash();

      service.delete(databaseName, collectionName, _id).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(
        `${service.basePath}/${databaseName}/collections/${collectionName}/records/${_id}`,
      );
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of Records', () => {
      const _id = chance.hash();
      const collectionName = chance.hash();
      const databaseName = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(databaseName, collectionName, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(Record));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(
        r => r.url === `${service.basePath}/${databaseName}/collections/${collectionName}/records`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a Record', () => {
      const _id = chance.hash();
      const collectionName = chance.hash();
      const databaseName = chance.hash();

      service.findOne(databaseName, collectionName, _id).then(res => {
        expect(res).toEqual(jasmine.any(Record));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(
        `${service.basePath}/${databaseName}/collections/${collectionName}/records/${_id}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });

  describe('update()', () => {
    it('updates and returns a Record', () => {
      const databaseName = chance.hash();
      const collectionName = chance.hash();
      const params = {
        _id: chance.hash(),
        properties: { name: chance.hash() },
      };

      service.update(databaseName, collectionName, params).then(res => {
        expect(res).toEqual(jasmine.any(Record));
        expect(res._id).toEqual(params._id);
        expect(res.properties.name).toEqual(params.properties.name);
      });

      const req = httpMock.expectOne(
        `${service.basePath}/${databaseName}/collections/${collectionName}/records/${params._id}`,
      );
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
