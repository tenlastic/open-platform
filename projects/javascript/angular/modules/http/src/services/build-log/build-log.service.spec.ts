import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BuildLog } from '../../models/build-log';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { BuildLogService } from './build-log.service';

describe('BuildLogService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: BuildLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        BuildLogService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(BuildLogService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('count()', () => {
    it('returns a count', () => {
      const _id = chance.hash();
      const buildId = chance.hash();
      const params = {
        where: { _id },
      };

      service.count(buildId, params).then(res => {
        expect(res).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${buildId}/logs/count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 1 });
    });
  });

  describe('create()', () => {
    it('creates and returns a BuildLog', () => {
      const buildId = chance.hash();
      const params = {
        buildId: chance.hash(),
        toUserId: chance.hash(),
      };

      service.create(buildId, params).then(res => {
        expect(res).toEqual(jasmine.any(BuildLog));
        expect(res._id).toBeDefined();
        expect(res.buildId).toEqual(params.buildId);
      });

      const req = httpMock.expectOne(`${service.basePath}/${buildId}/logs`);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          buildId: params.buildId,
          toUserId: params.toUserId,
        },
      });
    });
  });

  describe('find()', () => {
    it('returns an array of BuildLogs', () => {
      const _id = chance.hash();
      const buildId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(buildId, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(BuildLog));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${buildId}/logs`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });
});
