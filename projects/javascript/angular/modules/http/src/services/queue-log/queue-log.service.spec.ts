import { Chance } from 'chance';

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { QueueLog } from '../../models/queue-log';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { QueueLogService } from './queue-log.service';

describe('QueueLogService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let service: QueueLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        QueueLogService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(QueueLogService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('count()', () => {
    it('returns a count', () => {
      const _id = chance.hash();
      const queueId = chance.hash();
      const params = {
        where: { _id },
      };

      service.count(queueId, params).then(res => {
        expect(res).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${queueId}/logs/count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 1 });
    });
  });

  describe('create()', () => {
    it('creates and returns a QueueLog', () => {
      const queueId = chance.hash();
      const params = {
        queueId: chance.hash(),
        toUserId: chance.hash(),
      };

      service.create(queueId, params).then(res => {
        expect(res).toEqual(jasmine.any(QueueLog));
        expect(res._id).toBeDefined();
        expect(res.queueId).toEqual(params.queueId);
      });

      const req = httpMock.expectOne(`${service.basePath}/${queueId}/logs`);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          queueId: params.queueId,
          toUserId: params.toUserId,
        },
      });
    });
  });

  describe('find()', () => {
    it('returns an array of QueueLogs', () => {
      const _id = chance.hash();
      const queueId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(queueId, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(QueueLog));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${queueId}/logs`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });
});
