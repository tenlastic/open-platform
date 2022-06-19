import { Chance } from 'chance';

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { QueueMember } from '../../models/queue-member';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { QueueMemberService } from './queue-member.service';

describe('QueueMemberService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let service: QueueMemberService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        QueueMemberService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(QueueMemberService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('count()', () => {
    it('returns a count', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.count(params).then(res => {
        expect(res).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 1 });
    });
  });

  describe('create()', () => {
    it('creates and returns a QueueMember', () => {
      const params = { queueId: chance.hash() };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(QueueMember));
        expect(res._id).toBeDefined();
        expect(res.queueId).toEqual(params.queueId);
      });

      const req = httpMock.expectOne(`${service.basePath}`);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          queueId: params.queueId,
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
    it('returns an array of QueueMembers', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(QueueMember));
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
    it('returns a QueueMember', () => {
      const _id = chance.hash();

      service.findOne(_id).then(res => {
        expect(res).toEqual(jasmine.any(QueueMember));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(`${service.basePath}/${_id}`);
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });
});
