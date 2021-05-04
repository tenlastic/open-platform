import { Chance } from 'chance';

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GameAuthorization, IGameAuthorization } from '../../models/game-authorization';
import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';
import { EnvironmentServiceMock } from '../environment/environment.service.mock';
import { GameAuthorizationService } from './game-authorization.service';

describe('GameAuthorizationService', () => {
  const chance = new Chance();

  let httpMock: HttpTestingController;
  let service: GameAuthorizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        GameAuthorizationService,
        { provide: EnvironmentService, useClass: EnvironmentServiceMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(GameAuthorizationService);
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
    it('creates and returns a GameAuthorization', () => {
      const params = {
        status: IGameAuthorization.GameAuthorizationStatus.Granted,
      };

      service.create(params).then(res => {
        expect(res).toEqual(jasmine.any(GameAuthorization));
        expect(res._id).toBeDefined();
        expect(res.status).toEqual(params.status);
      });

      const req = httpMock.expectOne(service.basePath);
      expect(req.request.method).toBe('POST');
      req.flush({
        record: {
          _id: chance.hash(),
          status: params.status,
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
    it('returns an array of GameAuthorizations', () => {
      const _id = chance.hash();
      const params = {
        where: { _id },
      };

      service.find(params).then(res => {
        expect(res.length).toBe(1);
        expect(res[0]).toEqual(jasmine.any(GameAuthorization));
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
    it('returns a GameAuthorization', () => {
      const _id = chance.hash();

      service.findOne(_id).then(res => {
        expect(res).toEqual(jasmine.any(GameAuthorization));
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
    it('updates and returns a GameAuthorization', () => {
      const params = {
        _id: chance.hash(),
        status: IGameAuthorization.GameAuthorizationStatus.Granted,
      };

      service.update(params).then(res => {
        expect(res).toEqual(jasmine.any(GameAuthorization));
        expect(res._id).toEqual(params._id);
        expect(res.status).toEqual(params.status);
      });

      const req = httpMock.expectOne(`${service.basePath}/${params._id}`);
      expect(req.request.method).toBe('PUT');
      req.flush({ record: params });
    });
  });
});
