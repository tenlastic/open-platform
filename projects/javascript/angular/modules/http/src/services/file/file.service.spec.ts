import { Chance } from 'chance';

import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { File } from '../../models/file';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { FileService } from './file.service';

describe('FileService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let injector: TestBed;
  let service: FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        FileService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    service = injector.get(FileService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('delete()', () => {
    it('deletes the File and returns true', () => {
      const _id = chance.hash();
      const platform = chance.hash();
      const releaseId = chance.hash();

      service.delete(releaseId, platform, _id).then(res => {
        expect(res).toBeTruthy();
      });

      const req = httpMock.expectOne(
        `${service.basePath}/${releaseId}/platforms/${platform}/files/${_id}`,
      );
      expect(req.request.method).toBe('DELETE');
    });
  });

  describe('find()', () => {
    it('returns an array of Files', () => {
      const _id = chance.hash();
      const platform = chance.hash();
      const releaseId = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(releaseId, platform, params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(File));
        expect(res[0]._id).toBe(_id);
      });

      const req = httpMock.expectOne(
        r => r.url === `${service.basePath}/${releaseId}/platforms/${platform}/files`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        records: [{ _id }],
      });
    });
  });

  describe('findOne()', () => {
    it('returns a File', () => {
      const _id = chance.hash();
      const platform = chance.hash();
      const releaseId = chance.hash();

      service.findOne(releaseId, platform, _id).then(res => {
        expect(res).toEqual(jasmine.any(File));
        expect(res._id).toBe(_id);
      });

      const req = httpMock.expectOne(
        `${service.basePath}/${releaseId}/platforms/${platform}/files/${_id}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        record: { _id },
      });
    });
  });
});
