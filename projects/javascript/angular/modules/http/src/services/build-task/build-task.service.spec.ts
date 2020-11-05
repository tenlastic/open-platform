import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BuildTask } from '../../models/build-task';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { BuildTaskService } from './build-task.service';

describe('BuildTaskService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: BuildTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        BuildTaskService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(BuildTaskService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('delete()', () => {
    it('deletes the record and returns true', () => {
      const _id = chance.hash();
      const buildId = chance.hash();

      service.delete(buildId, _id).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(`${service.basePath}/${buildId}/tasks/${_id}`);
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of records', () => {
      const _id = chance.hash();
      const buildId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(buildId, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(BuildTask));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(r => r.url === `${service.basePath}/${buildId}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });
});
