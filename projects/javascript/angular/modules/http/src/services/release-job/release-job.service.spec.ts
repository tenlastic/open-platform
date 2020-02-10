import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ReleaseJob } from '../../models/release-job';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { ReleaseJobService } from './release-job.service';

describe('ReleaseJobService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: ReleaseJobService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        ReleaseJobService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(ReleaseJobService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('delete()', () => {
    it('deletes the record and returns true', () => {
      const _id = chance.hash();
      const releaseId = chance.hash();

      service.delete(releaseId, _id).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${releaseId}/jobs/${_id}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of records', () => {
      const _id = chance.hash();
      const releaseId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(releaseId, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(ReleaseJob));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${releaseId}/jobs`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });
});
