import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { WorkflowLog } from '../../models/workflow-log';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { WorkflowLogService } from './workflow-log.service';

describe('WorkflowLogService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: WorkflowLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        WorkflowLogService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(WorkflowLogService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('count()', () => {
    it('returns a count', () => {
      const _id = chance.hash();
      const workflowId = chance.hash();
      const params = {
        where: { _id },
      };

      service.count(workflowId, params).then(res => {
        expect(res).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${workflowId}/logs/count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 1 });
    });
  });

  describe('create()', () => {
    it('creates and returns a WorkflowLog', () => {
      const workflowId = chance.hash();
      const params = {
        workflowId: chance.hash(),
        toUserId: chance.hash(),
      };

      service.create(workflowId, params).then(res => {
        expect(res).toEqual(jasmine.any(WorkflowLog));
        expect(res._id).toBeDefined();
        expect(res.workflowId).toEqual(params.workflowId);
      });

      const req = httpMock.expectOne(`${service.basePath}/${workflowId}/logs`);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          workflowId: params.workflowId,
          toUserId: params.toUserId,
        },
      });
    });
  });

  describe('find()', () => {
    it('returns an array of WorkflowLogs', () => {
      const _id = chance.hash();
      const workflowId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(workflowId, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(WorkflowLog));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${workflowId}/logs`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });
});
